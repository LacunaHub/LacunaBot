import { PaymentMetadataProduct, PaymentStatus, PaymentType } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../database'
import { UserState } from '../../../utility/Authentication'
import { getTimestampFromSnowflake } from '../../../utility/Snowflake'

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
            created_at: getTimestampFromSnowflake(v._id)
        }
    })
}
