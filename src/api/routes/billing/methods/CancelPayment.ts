import { PaymentStatus } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../database'
import APIError from '../../../utility/APIError'

export default async function cancelPayment(ctx: Context) {
    const token = ctx.query.token as string

    if (!token) {
        ctx.throw(400, new APIError(4021))
    }

    const payment = await database.payments.findOne({ 'metadata.provider_external_id': token })

    if (!payment) {
        ctx.throw(404, new APIError(1018))
    }

    await database.payments.updateOne(
        { _id: payment._id },
        {
            $set: {
                status: PaymentStatus.Rejected,
                updated_at: Date.now()
            }
        }
    )

    ctx.redirect(`${process.env.LCN_WEBSITE_URL}/@me/bills?close=true`)
}
