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
    if (!server.premium.available || !server.premium.bill_id) ctx.throw(402, new APIError(2001))

    const bill = await database.bills.findOne({ _id: server.premium.bill_id })

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
                'premium.will_expire_on': 0,
                'premium.bill_id': null
            }
        }
    )

    await database.bills.updateOne(
        { _id: server.premium.bill_id },
        {
            $set: {
                'custom_fields.reference_id': toGuildId
            }
        }
    )

    bill.custom_fields.reference_id = toGuildId
    const diamondGuild = diamondGuilds.get(guildId)

    if (diamondGuild) {
        diamondGuild.cancel()
    }

    await addDiamond(bill)

    ctx.status = 204
}
