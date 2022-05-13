import Router from '@koa/router'
import { Context } from 'koa'
import db from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import { Bill as QiwiBill } from '../../utility/Qiwi'
import { authorize, checkPermissions } from '../utility/Authorize'

const router: Router = new Router({ prefix: '/payments' })

router.use(authorize)

router.post('/:guild_id', checkPermissions, createPayment)

async function createPayment(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const user_id = ctx.request.headers['user-id'] as string
    const { tier, provider, guild_name } = ctx.request.body

    if (isNaN(tier)) ctx.throw(400)
    if (!['QIWI'].includes(provider)) ctx.throw(400, 'Unknown Payment Provider')

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    const user = await db.users.findOne({ _id: user_id })
    if (!user) ctx.throw(404)

    const userBills = await db.bills.find({ 'custom_fields.user_id': user_id })
    if (userBills.filter(bill => Date.now() - bill.creation_timestamp < 300000).length >= 2) ctx.throw(425)

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
        comment: `Lacuna Diamond для сервера ${guild_name.slice(0, 32)} (${guild_id}) от пользователя ${user.user.username.slice(0, 32)}#${user.user.discriminator} (${user._id})`
    }

    const selectedTier = diamondPrices[tier >= 0 && tier <= 2 ? tier : 0]

    if (provider === 'QIWI') {
        data.amount.currency = 'RUB'
        data.amount.value = selectedTier.prices['RUB'] - selectedTier.discounts['RUB']

        const bill = new QiwiBill(data)
        const form = await bill.create()

        if (!form || !form.payUrl) ctx.throw(400)

        ctx.status = 200
        ctx.body = `${form.payUrl}&successUrl=${encodeURIComponent(`${process.env.WEBSITE_URL}/guilds/${guild_id}/settings`)}`

        return
    }
}

export default router
