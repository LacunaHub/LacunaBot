import { Snowflake } from '@/utility/SnowflakeUtils'
import { Document, model, Schema } from 'mongoose'
import { DiamondProductTier } from '..'

export default model<PaymentDocument>(
    'payments',
    new Schema<PaymentDocument>(
        {
            _id: { type: String },
            type: { type: Number, required: true },
            status: { type: Number, default: 0 },
            amount: {
                currency_code: { type: String, required: true },
                value: { type: Number, required: true }
            },
            payer_id: { type: String, required: true },
            metadata: {
                provider_external_id: { type: String, default: null },
                comment: { type: String, default: null },
                tier: { type: Number, required: true },
                product_id: { type: Number, required: true },
                ref_id: { type: String, required: true }
            },
            updated_at: { type: Number, default: null }
        },
        { versionKey: false }
    )
)

export interface PaymentDocument extends Document {
    _id: Snowflake
    type: PaymentType
    status: PaymentStatus
    amount: PaymentAmount
    payer_id: string
    metadata: PaymentMetadata
    updated_at: number
}

export enum PaymentType {
    PayPal,
    Tokens,
    Qiwi
}

export enum PaymentStatus {
    Unpaid,
    Paid,
    Rejected,
    Expired
}

export interface PaymentAmount {
    currency_code: PaymentAmountCurrencyCode
    value: number
}

export type PaymentAmountCurrencyCode = 'USD' | 'RUB' | 'KZT' | 'TKN'

export interface PaymentMetadata {
    provider_external_id: string | null
    comment: string | null
    tier: DiamondProductTier
    product_id: PaymentMetadataProduct
    ref_id: string
}

export enum PaymentMetadataProduct {
    Diamond
}
