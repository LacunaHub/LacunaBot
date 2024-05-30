import { APIGuild, APIUser } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import {
    projectTeamRoleId,
    serverBoosterRoleId,
    subscribedPatronRoleId,
    supportServerId,
    supportServerMaxAllowedBoosts
} from '../../../../internals/utility/Constants'
import { DiscordRolesCheckout } from '../../../modules/billing/providers/DiscordRoles'
import { Order } from '../../../modules/billing/providers/PayPal'
import APIError from '../../../utility/APIError'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function createPayment(ctx: Context) {
    const currentUser: Partial<APIUser> = ctx.state.user
    const { tier, provider, guild_id, guild_name } = ctx.request.body

    if (isNaN(tier)) ctx.throw(400, new APIError(1019))

    const server = await database.servers.findOne({ _id: guild_id })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const userBills = await database.bills.find({ 'custom_fields.user_id': currentUser.id })

    if (userBills.filter(bill => Date.now() - bill.creation_timestamp < 300000).length >= 5) {
        ctx.throw(425, new APIError(4009))
    }

    const { diamondPrices, rootUsers } = await database.getInternalData()
    const data = {
        amount: {
            currency: 'RUB',
            value: 0
        },
        custom_fields: {
            type: 'GUILD',
            reference_id: guild_id,
            user_id: currentUser.id,
            tier
        },
        comment: `Lacuna Diamond для ${guild_name.slice(0, 32)} (${guild_id})`
    }

    const selectedTier = diamondPrices[tier >= 0 && tier <= 2 ? tier : 0]

    // if (provider === 'QIWI') {
    //     data.amount.currency = 'RUB'
    //     data.amount.value = selectedTier.prices['RUB'] - selectedTier.discounts['RUB']

    //     const bill = new Bill(data)
    //     const form = await bill.create()

    //     if (!form?.payUrl) {
    //         ctx.throw(400, new APIError(5012))
    //     }

    //     ctx.status = 200
    //     ctx.body = `${form.payUrl}&successUrl=${encodeURIComponent(`${process.env.LCN_WEBSITE_URL}/@me/bills`)}`
    // } else

    if (provider === 'PAYPAL') {
        data.amount.currency = 'USD'
        data.amount.value = selectedTier.prices['USD'] - selectedTier.discounts['USD']
        data.comment = `Lacuna Diamond for ${guild_name.slice(0, 32)} (${guild_id})`

        const order = new Order(data)
        const form = await order.create()
        const approveLink = form?.links?.find(i => i.rel === 'approve')

        if (!approveLink?.href) {
            ctx.throw(400, new APIError(5012))
        }

        ctx.status = 200
        ctx.body = approveLink.href
    } else if (['DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY', 'PROJECT_TEAM'].includes(provider)) {
        if (server.premium.available) ctx.throw(400, new APIError(2009))

        if (provider === 'DISCORD_NITRO_BOOST') {
            let supportServer: APIGuild

            try {
                supportServer = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guild(supportServerId))) as any
            } catch (err) {
                ctx.throw(500, new APIError(5019))
            }

            if (supportServer.premium_subscription_count >= supportServerMaxAllowedBoosts) {
                ctx.throw(400, new APIError(4022))
            }
        }

        data.amount.currency = 'DRC'
        data.amount.value = 1

        let roleIds = [subscribedPatronRoleId],
            maxActiveBills = 1

        if (provider === 'DISCORD_NITRO_BOOST') {
            roleIds = [serverBoosterRoleId]
        } else if (provider === 'PROJECT_TEAM') {
            roleIds = [projectTeamRoleId]
            maxActiveBills = 2

            if (rootUsers.includes(currentUser.id)) {
                maxActiveBills = 100
            }
        }

        const discordRolesCheckout = new DiscordRolesCheckout(data, provider, roleIds, maxActiveBills)
        const rolesMember = await discordRolesCheckout.create()
        let code: number

        if (rolesMember === 'NO_ROLES') {
            code = 4019

            if (provider === 'DISCORD_NITRO_BOOST') {
                code = 4020
            }
        } else if (rolesMember === 'MAX_ACTIVE_BILLS') {
            code = 3015
        }

        if (typeof code === 'number') {
            ctx.throw(400, new APIError(code))
        }

        ctx.status = 204
    } else {
        ctx.throw(400, new APIError(1020))
    }
}
