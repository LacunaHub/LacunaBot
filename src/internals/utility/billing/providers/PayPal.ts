import fetch from 'node-fetch'
import { v4 as idv4 } from 'uuid'
import database from '../../../../database'

const PAYPAL_API = process.env.NODE_ENV === 'development' ? 'https://api-m.sandbox.paypal.com/v2' : 'https://api-m.paypal.com/v2'

export class Order {
    public bill_id: string
    public amount: OrderData['amount']
    public custom_fields: OrderData['custom_fields']
    public description: string

    constructor(data: OrderData) {
        this.bill_id = idv4()

        this.amount = data.amount

        this.custom_fields = data.custom_fields

        this.description = data.comment
    }

    async create() {
        const order = await createOrder(this)

        await database.bills.create({
            _id: this.bill_id,
            external_id: order.id,
            type: 'PAYPAL',
            amount: Number(this.amount.value),
            currency: this.amount.currency,
            status: {
                value: 'WAITING',
                changed_timestamp: Date.now()
            },
            custom_fields: {
                type: this.custom_fields.type,
                reference_id: this.custom_fields.reference_id,
                user_id: this.custom_fields.user_id,
                tier: Number(this.custom_fields.tier)
            },
            comment: this.description,
            creation_timestamp: Date.now()
        } as any)

        return order
    }
}

async function createOrder(data: Order): Promise<APIOrder> {
    return fetch(`${PAYPAL_API}/checkout/orders`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: data.amount.currency,
                        value: `${data.amount.value}`
                    },
                    custom_id: data.bill_id,
                    description: data.description
                }
            ],
            application_context: {
                return_url: `${process.env.API_URL}/payments/charge`,
                cancel_url: `${process.env.API_URL}/payments/cancel`
            }
        })
    })
        .then(response => {
            return response.json()
        })
        .catch(err => {
            throw new Error(err)
        })
}

export async function captureOrder(token: string): Promise<APIOrder> {
    return fetch(`${PAYPAL_API}/checkout/orders/${token}/capture`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            return response.json()
        })
        .catch(err => {
            throw new Error(err)
        })
}

export interface OrderData {
    bill_id?: string
    amount: {
        value: string | number
        currency: 'USD' | string
    }
    custom_fields: {
        type: string
        reference_id: string
        user_id: string
        tier: number
    }
    comment: string
}

export interface APIOrder {
    id: string
    status: string
    purchase_units?: Array<{
        reference_id: string
        shipping: {
            name: {
                full_name: string
            }
        }
    }>
    payer?: {
        name: {
            given_name: string
            surname: string
        }
        email_address: string
        payer_id: string
        address: {
            country_code: string
        }
    }
    links: Array<{
        href: string
        rel: 'self' | 'approve' | 'update' | 'capture'
        method: 'GET' | 'POST' | 'PATCH'
    }>
}
