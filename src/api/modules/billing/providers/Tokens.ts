import { PaymentAmount, PaymentStatus, PaymentType, Product } from '@lacunahub/lacuna-database-driver'
import { PaymentData, addDiamond } from '..'
import database from '../../../../database'
import { generateSnowflake } from '../../../utility/Snowflake'

export class TokensCheckout {
    public paymentId: string
    public amount: PaymentAmount
    public payerId: string
    public comment: string
    public product: Product
    public refId: string

    constructor(data: PaymentData) {
        this.paymentId = generateSnowflake()

        this.amount = data.amount

        this.payerId = data.payerId

        this.comment = data.comment ?? null

        this.product = data.product

        this.refId = data.refId
    }

    async create() {
        const payment = await database.payments.create({
            _id: this.paymentId,
            type: PaymentType.Tokens,
            status: PaymentStatus.Paid,
            amount: {
                currency_code: this.amount.currency_code,
                value: this.amount.value
            },
            payer_id: this.payerId,
            metadata: {
                provider_external_id: null,
                comment: this.comment,
                tier: this.product.tier,
                product_id: this.product.product_id,
                ref_id: this.refId
            }
        })

        await database.users.updateOne({ _id: this.payerId }, { $inc: { tokens: -this.amount.value } })
        await addDiamond(payment)

        return payment
    }
}
