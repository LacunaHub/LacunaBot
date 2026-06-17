import { type UserState } from '@/api/utility/Authentication.js'
import database from '@/database/index.js'
import { PaymentMetadataProduct, PaymentStatus, PaymentType } from '@/database/schemas/Payments.js'
import { SnowflakeUtils } from '@/utility/SnowflakeUtils.js'
import { type Context } from 'koa'

export default async function getCurrentUserBills(ctx: Context) {
    const currentUser: UserState = ctx.state.user,
        currentUserPayments = await database.payments.find({ payer_id: currentUser.id })

    ctx.status = 200
    ctx.body = currentUserPayments.reverse().map(v => {
        return {
            id: v._id,
            type: PaymentType[v.type],
            status: PaymentStatus[v.status],
            amount: `${v.amount.value} ${v.amount.currency_code}`,
            product_name: PaymentMetadataProduct[v.metadata.product_id],
            ref_id: v.metadata.ref_id,
            comment: v.metadata.comment,
            created_at: SnowflakeUtils.getTimestamp(v._id)
        }
    })
}
