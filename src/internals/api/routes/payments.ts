import Router from '@koa/router'
import { Context } from 'koa'
import { authorize, checkPermissions } from '../utility/Authorize'
import { ServerDocument } from '../../../database/schemas/Servers'
import db from '../../../database'
import QiwiBill from '../../structures/QiwiBill'

const router: Router = new Router({ prefix: '/payments' })

router.use(authorize)

router.post('/:guild_id', checkPermissions, createPayment)

async function createPayment(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const user_id = ctx.request.headers['user-id'] as string
    const amount = Number(ctx.query.amount)

    if (!user_id || (!amount || isNaN(amount))) {
        ctx.status = 400; ctx.body = 'Bad Request'

        return
    }

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404

        return
    }

    const user = await db.users.findOne({ _id: user_id })

    if (!user) {
        ctx.status = 404

        return
    }

    if (user.bills.filter(bill => (Date.now() - bill.creation_timestamp) < 600000).length >= 2) {
        ctx.status = 425

        return
    }

    const data = {
        amount: {
            currency: 'RUB',
            value: amount as any
        },
        custom_fields: {
            type: 'GUILD',
            reference_id: guild_id,
            user_id: user_id
        }
    }

    const bill = new QiwiBill(data)
    const form = await bill.create()

    if (!form || !form.payUrl) {
        ctx.status = 400; ctx.body = 'Bad Request'

        return
    }

    ctx.status = 200; ctx.body = `${form.payUrl}&successUrl=${encodeURIComponent(`${process.env.WEBSITE_URL}/guilds/${guild_id}/settings`)}`
}

export default router