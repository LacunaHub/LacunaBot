import Router from '@koa/router'
import { Context } from 'koa'
import db from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import { addDiamond } from '../../utility/BillUtils'
import { NitroBoost } from '../../utility/DiscordNitroBoost'
import { APIOrder, captureOrder, Order as PayPalOrder } from '../../utility/PayPal'
import { Bill as QiwiBill } from '../../utility/Qiwi'
import { authorize } from '../utility/Authorize'

const router: Router = new Router({ prefix: '/payments' })

router.post('/', authorize, createPayment)
router.get('/charge', chargePayment)
router.get('/cancel', cancelPayment)

async function createPayment(ctx: Context) {
    const user_id = ctx.request.headers['user-id'] as string
    const { tier, provider, guild_id, guild_name } = ctx.request.body

    if (isNaN(tier)) ctx.throw(400)
    if (!['QIWI', 'PAYPAL', 'DISCORD_NITRO_BOOST'].includes(provider)) ctx.throw(400, 'Unknown Payment Provider')

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    const userBills = await db.bills.find({ 'custom_fields.user_id': user_id })
    if (userBills.filter(bill => Date.now() - bill.creation_timestamp < 300000).length >= 5) ctx.throw(425)

    const { diamondPrices } = await db.json.get()
    const data = {
        amount: {
            currency: 'RUB',
            value: 0
        },
        custom_fields: {
            type: 'GUILD',
            reference_id: guild_id,
            user_id,
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

        if (!form?.payUrl) ctx.throw(400)

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

        if (!approveLink?.href) ctx.throw(400)

        ctx.status = 200
        ctx.body = approveLink.href
    }

    if (provider === 'DISCORD_NITRO_BOOST') {
        if (server.server.premium.available) ctx.throw(400, 'There is already a premium on this server')

        data.amount.currency = 'DNB'
        data.amount.value = 1

        const nitroBoost = new NitroBoost(data)
        const isNitroBooster = await nitroBoost.create()

        if (!isNitroBooster) ctx.throw(400, 'Could not find nitro boost on our support server')

        ctx.status = 204
    }
}

async function chargePayment(ctx: Context) {
    const token = ctx.query.token as string,
        payerId = ctx.query.PayerID

    if (!token || !payerId) ctx.throw(400)

    let order: APIOrder

    try {
        order = await captureOrder(token)
    } catch (err) {
        ctx.throw(500)
    }

    if (order.status !== 'COMPLETED') ctx.throw(402)

    const bill = await db.bills.findOne({ external_id: order.id })

    if (!bill) ctx.throw(404)

    const server = await db.servers.findOne({ _id: bill.custom_fields.reference_id })

    if (!server) ctx.throw(404)

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

    if (!token) ctx.throw(400)

    const bill = await db.bills.findOne({ external_id: token })

    if (!bill) ctx.throw(404)

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
