import { PaymentStatus, PaymentType } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../database'

export default async function getPatrons(ctx: Context) {
    const patrons = await database.users.find({ 'premium.last_charge_timestamp': { $ne: null } })
    const bills = await database.payments.find({
        type: { $in: [PaymentType.PayPal, PaymentType.Qiwi] },
        status: PaymentStatus.Paid,
        payer_id: { $in: patrons.map(i => i._id) }
    })

    ctx.status = 200
    ctx.body = patrons.map(i => {
        const userBills = bills.filter(ii => ii.payer_id === i._id)
        const supportedAmount = userBills.reduce(
            (x, y) => {
                x[y.amount.currency_code] += y.amount.value
                return x
            },
            { RUB: 0, USD: 0 }
        )

        return {
            _id: i._id,
            avatar: i.user.avatar,
            username: i.user.username,
            is_active: i.premium.available,
            is_big_patron: supportedAmount.RUB >= 1000 || supportedAmount.USD >= 15
        }
    })
}
