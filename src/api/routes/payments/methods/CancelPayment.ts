import { Context } from 'koa'
import database from '../../../../database'
import APIError from '../../../utility/APIError'

export default async function cancelPayment(ctx: Context) {
    const token = ctx.query.token as string

    if (!token) {
        ctx.throw(400, new APIError(4021))
    }

    const bill = await database.bills.findOne({ external_id: token })

    if (!bill) {
        ctx.throw(404, new APIError(1018))
    }

    await database.bills.updateOne(
        { _id: bill._id },
        {
            $set: {
                'status.value': 'REJECTED',
                'status.changed_timestamp': Date.now()
            }
        }
    )

    ctx.redirect(`${process.env.LCN_WEBSITE_URL}/@me/bills`)
}
