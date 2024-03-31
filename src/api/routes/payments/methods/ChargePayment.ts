import { Context } from 'koa'
import database from '../../../../database'
import { addDiamond } from '../../../modules/billing'
import { APIOrder, captureOrder } from '../../../modules/billing/providers/PayPal'
import APIError from '../../../utility/APIError'

export default async function chargePayment(ctx: Context) {
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

    const bill = await database.bills.findOne({ external_id: order.id })

    if (!bill) {
        ctx.throw(404, new APIError(1018))
    }

    const server = await database.servers.findOne({ _id: bill.custom_fields.reference_id })

    if (!server) {
        ctx.throw(404, new APIError(1003))
    }

    await database.bills.updateOne(
        { _id: bill._id },
        {
            $set: {
                'status.value': 'PAID',
                'status.changed_timestamp': Date.now()
            }
        }
    )

    await addDiamond(bill, server)
    ctx.redirect(`${process.env.LCN_WEBSITE_URL}/@me/bills`)
}
