import Router from '@koa/router'
import { APIUser } from 'discord.js'
import { Context } from 'koa'
import db from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import { addDiamond, diamond_subscriber_role_id, server_booster_role_id } from '../../utility/billing'
import { DiscordRolesCheckout } from '../../utility/billing/providers/DiscordRoles'
import { APIOrder, Order as PayPalOrder, captureOrder } from '../../utility/billing/providers/PayPal'
import { Bill as QiwiBill } from '../../utility/billing/providers/QIWI'
import APIError from '../utility/APIError'
import { authorize } from '../utility/Authorize'

const router: Router = new Router({ prefix: '/payments' })

router.post('/', authorize, createPayment)
router.get('/charge', chargePayment)
router.get('/cancel', cancelPayment)

async function createPayment(ctx: Context) {
    const currentUser: Partial<APIUser> = ctx.state.user
    const { tier, provider, guild_id, guild_name } = ctx.request.body

    if (isNaN(tier)) ctx.throw(400, new APIError(1019))
    if (!['QIWI', 'PAYPAL', 'DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY'].includes(provider)) ctx.throw(400, new APIError(1020))

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const userBills = await db.bills.find({ 'custom_fields.user_id': currentUser.id })

    if (userBills.filter(bill => Date.now() - bill.creation_timestamp < 300000).length >= 5) {
        ctx.throw(425, new APIError(4009))
    }

    const { diamondPrices } = await db.json.get()
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

    if (provider === 'QIWI') {
        data.amount.currency = 'RUB'
        data.amount.value = selectedTier.prices['RUB'] - selectedTier.discounts['RUB']

        const bill = new QiwiBill(data)
        const form = await bill.create()

        if (!form?.payUrl) {
            ctx.throw(400, new APIError(5012))
        }

        ctx.status = 200
        ctx.body = `${form.payUrl}&successUrl=${encodeURIComponent(`${process.env.WEBSITE_URL}/@me/bills`)}`
    }

    if (provider === 'PAYPAL') {
        data.amount.currency = 'USD'
        data.amount.value = selectedTier.prices['USD'] - selectedTier.discounts['USD']
        data.comment = `Lacuna Diamond for ${guild_name.slice(0, 32)} (${guild_id})`

        const order = new PayPalOrder(data)
        const form = await order.create()
        const approveLink = form?.links?.find(i => i.rel === 'approve')

        if (!approveLink?.href) {
            ctx.throw(400, new APIError(5012))
        }

        ctx.status = 200
        ctx.body = approveLink.href
    }

    if (['DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY'].includes(provider)) {
        if (server.server.premium.available) ctx.throw(400, new APIError(2009))

        data.amount.currency = 'DRC'
        data.amount.value = 1

        let roleIds = [diamond_subscriber_role_id],
            maxActiveBills = 2

        if (provider === 'DISCORD_NITRO_BOOST') {
            roleIds = [server_booster_role_id]
            maxActiveBills = 1
        }

        const discordRolesCheckout = new DiscordRolesCheckout(data, provider, roleIds, maxActiveBills)
        const rolesMember = await discordRolesCheckout.create()
        let code: number

        if (rolesMember === 'NO_ROLES') {
            code = 4019

            if (provider === 'DISCORD_NITRO_BOOST') {
                code = 4020
            }
        }

        if (rolesMember === 'MAX_ACTIVE_BILLS') {
            code = 3015
        }

        if (typeof code === 'number') {
            ctx.throw(400, new APIError(code))
        }

        ctx.status = 204
    }
}

async function chargePayment(ctx: Context) {
    const token = ctx.query.token as string,
        payerId = ctx.query.PayerID

    if (!token || !payerId) {
        ctx.throw(400, new APIError(4021))
    }

    let order: APIOrder

    try {
        order = await captureOrder(token)
    } catch (err) {
        ctx.throw(500, new APIError(5013))
    }

    if (order.status !== 'COMPLETED') {
        ctx.throw(402, new APIError(5014))
    }

    const bill = await db.bills.findOne({ external_id: order.id })

    if (!bill) {
        ctx.throw(404, new APIError(1018))
    }

    const server = await db.servers.findOne({ _id: bill.custom_fields.reference_id })

    if (!server) {
        ctx.throw(404, new APIError(1003))
    }

    await db.bills.updateOne(
        { _id: bill._id },
        {
            $set: {
                'status.value': 'PAID',
                'status.changed_timestamp': Date.now()
            }
        }
    )

    await addDiamond(bill, server)
    ctx.redirect(`${process.env.WEBSITE_URL}/@me/bills`)
}

async function cancelPayment(ctx: Context) {
    const token = ctx.query.token as string

    if (!token) {
        ctx.throw(400, new APIError(4021))
    }

    const bill = await db.bills.findOne({ external_id: token })

    if (!bill) {
        ctx.throw(404, new APIError(1018))
    }

    await db.bills.updateOne(
        { _id: bill._id },
        {
            $set: {
                'status.value': 'REJECTED',
                'status.changed_timestamp': Date.now()
            }
        }
    )

    ctx.redirect(`${process.env.WEBSITE_URL}/@me/bills`)
}

export default router
