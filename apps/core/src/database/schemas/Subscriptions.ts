import { Snowflake } from '@/utility/SnowflakeUtils'
import { Document, model, Schema } from 'mongoose'

export default model<SubscriptionDocument>(
    'subscriptions',
    new Schema<SubscriptionDocument>(
        {
            _id: { type: String },
            type: { type: Number, required: true },
            status: { type: Number, default: 0 },
            subscriber_id: { type: String, required: true },
            metadata: {
                provider_external_id: { type: String, default: null },
                product_id: { type: Number, required: true },
                ref_id: { type: String, required: true }
            },
            updated_at: { type: Number, default: null }
        },
        { versionKey: false }
    )
)

export interface SubscriptionDocument extends Document {
    _id: Snowflake
    type: SubscriptionType
    status: SubscriptionStatus
    subscriber_id: string
    metadata: SubscriptionMetadata
    updated_at: number
}

export enum SubscriptionType {
    Patreon,
    Boosty,
    DiscordNitroBoost,
    ProjectTeam
}

export enum SubscriptionStatus {
    Pending,
    Active,
    Cancelled
}

export interface SubscriptionMetadata {
    provider_external_id: string | null
    product_id: SubscriptionMetadataProduct
    ref_id: string
}

export enum SubscriptionMetadataProduct {
    Diamond
}
