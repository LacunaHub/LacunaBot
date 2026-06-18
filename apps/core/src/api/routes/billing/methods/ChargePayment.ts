import { addDiamond } from '@/api/modules/billing/index.js'
import { type APIOrder, captureOrder } from '@/api/modules/billing/providers/PayPal/Order.js'
import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { type PaymentDocument, PaymentMetadataProduct, PaymentStatus } from '@/database/schemas/Payments.js'
import { type Context } from 'koa'

export default async function chargePayment(ctx: Context) {
    const token = ctx.query.token as string,
        subscriptionId = ctx.query.subscription_id

    let payment!: PaymentDocument

    if (typeof subscriptionId !== 'undefined') {
        payment = await database.payments.findOne({ 'metadata.provider_external_id': subscriptionId }).orFail()
    } else {
        const payerId = ctx.query.PayerID

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

        payment = await database.payments.findOne({ 'metadata.provider_external_id': order.id }).orFail()
    }

    if (!payment) {
        ctx.throw(404, new APIError(1018))
    }

    if (payment.metadata.product_id === PaymentMetadataProduct.Diamond) {
        const server = await database.servers.findOne({ _id: payment.metadata.ref_id })

        if (!server) {
            ctx.throw(404, new APIError(1003))
        }

        await database.payments.updateOne(
            {
                _id: payment._id
            },
            {
                $set: {
                    status: PaymentStatus.Paid,
                    updated_at: Date.now()
                }
            }
        )

        await addDiamond(payment, { server })
    }

    ctx.redirect(`${process.env.LCN_WEBSITE_URL}/@me/bills?close=true`)
}
