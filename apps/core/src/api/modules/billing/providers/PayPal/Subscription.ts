import database, { Product } from '@/database'
import { PaymentAmount, PaymentStatus, PaymentType } from '@/database/schemas/Payments'
import { Snowflake, SnowflakeUtils } from '@/utility/SnowflakeUtils'
import fetch from 'node-fetch'
import { HATEOASLink, PayPalAPI, SubscriptionPlans } from '.'
import { PaymentData } from '../..'

export class PayPalSubscription {
    public paymentId: Snowflake
    public amount: PaymentAmount
    public payerId: string
    public comment: string | null
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
        const subscription = await this.createSubscription()
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
                provider_external_id: subscription.id,
                comment: this.comment,
                tier: this.product.tier,
                product_id: this.product.product_id,
                ref_id: this.refId
            }
        })

        return { subscription, payment }
    }

    private async createSubscription(): Promise<APISubscription> {
        const planId = SubscriptionPlans.Monthly

        try {
            const response = await fetch(`${PayPalAPI}/v1/billing/subscriptions`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(`${process.env.LCN_PAYPAL_CLIENT_ID}:${process.env.LCN_PAYPAL_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan_id: planId,
                    custom_id: this.paymentId,
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

export interface APISubscription {
    status: APISubscriptionStatus
    status_change_note: string
    status_update_time: string
    id: string
    plan_id: string
    quantity: string
    custom_id: string
    plan_overridden: boolean
    start_time: string
    shipping_amount: {
        currency_code: string
        value: string
    }
    subscriber: APISubscriptionSubscriber
    billing_info: object
    created_time: string
    updated_time: string
    plan: object
    links: HATEOASLink[]
}

export type APISubscriptionStatus = 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'

export interface APISubscriptionSubscriber {
    email_address: string
    payer_id: string
    name: {
        given_name: string
        surname: string
    }
    phone: {
        phone_type: APISubscriptionSubscriberPhoneType
        phone_number: {
            national_number: string
        }
    }
    shipping_address: object
    payment_source: object
}

export type APISubscriptionSubscriberPhoneType = 'FAX' | 'HOME' | 'MOBILE' | 'OTHER' | 'PAGER'
