import { PaymentDocument, SubscriptionDocument } from '@lacunahub/lacuna-database-driver'
import { RESTAPIPartialCurrentUserGuild } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import { addDiamond } from '../../../modules/billing'
import { diamondGuilds } from '../../../modules/billing/utility/DiamondGuild'
import APIError from '../../../utility/APIError'
import { oauth2 } from '../../../utility/DiscordOAuth2'

export default async function transferDiamond(ctx: Context) {
    const guildId = ctx.params.guild_id,
        toGuildId = ctx.params.to_guild_id

    let userGuilds: RESTAPIPartialCurrentUserGuild[] = []

    try {
        userGuilds = await oauth2.getUserGuilds(ctx.request.headers.authorization)
    } catch (err) {
        ctx.throw(400, new APIError(5001))
    }

    const isGuildOwner = userGuilds.filter(i => [guildId, toGuildId].includes(i.id)).every(i => i.owner)

    if (!isGuildOwner) {
        ctx.throw(403, new APIError(4002))
    }

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) ctx.throw(404, new APIError(1003))
    if (!server.premium.available || !server.premium.charged_via) ctx.throw(402, new APIError(2001))

    const [sBillType, sBillId] = server.premium.charged_via?.split(':') ?? []
    let bill: PaymentDocument | SubscriptionDocument

    if (sBillType === 'Payment') {
        bill = await database.payments.findOne({ _id: sBillId })
    } else if (sBillType === 'Subscription') {
        bill = await database.subscriptions.findOne({ _id: sBillId })
    }

    if (!bill) {
        ctx.throw(400, new APIError(1018))
    }

    const toServer = await database.servers.findOne({ _id: toGuildId })

    if (!toServer || toServer.blocked) ctx.throw(404, new APIError(1003))
    if (toServer.premium.available) ctx.throw(404, new APIError(2009))

    await database.servers.updateOne(
        { _id: guildId },
        {
            $set: {
                'premium.available': false,
                'premium.expires_at': null,
                'premium.charged_via': null
            }
        }
    )

    if (sBillType === 'Payment') {
        await database.payments.updateOne(
            { _id: bill._id },
            {
                $set: {
                    'metadata.ref_id': toGuildId
                }
            }
        )
    } else if (sBillType === 'Subscription') {
        await database.subscriptions.updateOne(
            { _id: bill._id },
            {
                $set: {
                    'metadata.ref_id': toGuildId
                }
            }
        )
    }

    bill.metadata.ref_id = toGuildId
    const diamondGuild = diamondGuilds.get(guildId)

    if (diamondGuild) {
        diamondGuild.cancel()
    }

    await addDiamond(bill, { until: server.premium.expires_at })

    ctx.status = 204
}
