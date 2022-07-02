import { Document, model, Schema } from 'mongoose'

export default model<IBill>(
    'bills',
    new Schema<IBill>(
        {
            _id: { type: String },
            external_id: { type: String },
            type: { type: String, required: true, uppercase: true },
            amount: { type: Number, required: true },
            currency: { type: String, required: true, uppercase: true },
            status: {
                value: { type: String, required: true, uppercase: true },
                changed_timestamp: { type: Number, required: true }
            },
            custom_fields: {
                type: { type: String, required: true, uppercase: true },
                reference_id: { type: String, required: true },
                user_id: { type: String, required: true },
                tier: { type: Number, required: true }
            },
            comment: { type: String, default: null },
            creation_timestamp: { type: Number, required: true },
            expiration_timestamp: { type: Number }
        },
        { versionKey: false }
    )
)

export interface IBill extends Document {
    _id: string
    external_id?: string
    type: 'QIWI'
    amount: number
    currency: string
    status: {
        value: 'WAITING' | 'PAID' | 'REJECTED' | 'EXPIRED'
        changed_timestamp: number
    }
    custom_fields: {
        type: string
        reference_id: string
        user_id: string
        tier: number
    }
    comment: string
    creation_timestamp: number
    expiration_timestamp?: number
}
