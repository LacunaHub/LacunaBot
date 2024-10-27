import { PaymentAmount, PaymentStatus, PaymentType, Product, Snowflake, SnowflakeUtils } from '@lacunahub/lacuna-database-driver'
import fetch from 'node-fetch'
import { HATEOASLink, PayPalAPI } from '.'
import { PaymentData } from '../..'
import database from '../../../../../database'

export class PayPalOrder {
    public paymentId: Snowflake
    public amount: PaymentAmount
    public payerId: string
    public comment: string
    public product: Product
    public refId: string

    constructor(data: PaymentData) {
        this.paymentId = SnowflakeUtils.generate()

        this.amount = data.amount

        this.payerId = data.payerId

        this.comment = data.comment ?? null

        this.product = data.product

        this.refId = data.refId
    }

    async create() {
        const price = this.product.prices.find(v => v.currency_code === this.amount.currency_code),
            priceAmount = price.sale_amount ? price.sale_amount : price.amount

        const order = await this.createOrder(priceAmount)
        const payment = await database.payments.create({
            _id: this.paymentId,
            type: PaymentType.PayPal,
            status: PaymentStatus.Unpaid,
            amount: {
                currency_code: this.amount.currency_code,
                value: this.amount.value
            },
            payer_id: this.payerId,
            metadata: {
                provider_external_id: order.id,
                comment: this.comment,
                tier: this.product.tier,
                product_id: this.product.product_id,
                ref_id: this.refId
            }
        })

        return { order, payment }
    }

    private async createOrder(price: number): Promise<APIOrder> {
        try {
            const response = await fetch(`${PayPalAPI}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(`${process.env.LCN_PAYPAL_CLIENT_ID}:${process.env.LCN_PAYPAL_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            amount: {
                                currency_code: 'USD',
                                value: price
                            },
                            custom_id: this.paymentId,
                            description: this.comment
                        }
                    ],
                    application_context: {
                        return_url: `${process.env.LCN_API_URL}/billing/payments/charge`,
                        cancel_url: `${process.env.LCN_API_URL}/billing/payments/cancel`
                    }
                })
            })

            return await response.json()
        } catch (err) {
            throw new Error(err)
        }
    }
}

export async function captureOrder(orderId: string): Promise<APIOrder> {
    try {
        const response = await fetch(`${PayPalAPI}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.LCN_PAYPAL_CLIENT_ID}:${process.env.LCN_PAYPAL_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        })

        return await response.json()
    } catch (err) {
        throw new Error(err)
    }
}

export interface APIOrder {
    create_time: string
    update_time: string
    id: string
    processing_instruction: APIOrderProcessingInstruction
    purchase_units
    payment_source: object
    intent: APIOrderIntent
    payer: object
    status: APIOrderStatus
    links: HATEOASLink[]
}

export type APIOrderProcessingInstruction = 'ORDER_COMPLETE_ON_PAYMENT_APPROVAL' | 'NO_INSTRUCTION'

export type APIOrderIntent = 'CAPTURE' | 'AUTHORIZE'

export type APIOrderStatus = 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED'
