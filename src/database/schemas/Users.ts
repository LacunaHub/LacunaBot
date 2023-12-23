import { Document, model, Schema } from 'mongoose'

export default model<UserDocument>(
    'users',
    new Schema<UserDocument>(
        {
            _id: { type: String },
            user: {
                username: { type: String, default: null },
                discriminator: { type: String, default: null },
                avatar: { type: String, default: null },
                flags: { type: Number, default: 0 },
                global_name: { type: String, default: null }
            },
            premium: {
                available: { type: Boolean, default: false },
                expiration_timestamp: { type: Number, default: null },
                last_charge_timestamp: { type: Number, default: null }
            },
            activities: {
                levels: { type: Array, default: [] },
                wallets: { type: Array, default: [] }
            },
            reports: { type: Array, default: [] },
            restoring_data: { type: Array, default: [] },
            created_at: { type: Number, default: () => Date.now() }
        },
        { versionKey: false }
    )
)

export interface UserDocument extends Document {
    _id: string
    /** @deprecated */
    flags: number
    user: {
        username: string
        /** @deprecated */
        discriminator: string
        avatar: string
        flags: number
        global_name: string
    }
    premium: {
        available: boolean
        expiration_timestamp: number
        last_charge_timestamp: number
    }
    activities: {
        levels: IUserLevel[]
        wallets: IUserWallet[]
    }
    reports: IUserReport[]
    restoring_data: IRestoringData[]
    created_at: number
}

export interface IUserLevel {
    guild_id: string
    experience: {
        total: number
        current: number
        level: number
    }
    activity: {
        total_messages: number
        last_message_at: number
        total_voice_time: number
        voice_connected_at: number
    }
    received_awards?: string[]
}

export interface IUserWallet {
    guild_id: string
    currencies: IWalletCurrency[]
    transactions: IWalletTransaction[]
    activity: {
        last_message_at: number
        voice_connected_at: number
    }
}

export interface IWalletCurrency {
    id: string
    amount: number
}

export interface IWalletTransaction {
    type: WalletTransactionType
    amount: number
    details: string
    timestamp: number
}

export type WalletTransactionType = 'PURCHASE' | 'SALE' | 'TRANSFER_TO' | 'TRANSFER_FROM' | 'EXCHANGE'

export interface IUserReport {
    sender_id: string
    guild_id: string
    reason: string
    created_at: number
}

export interface IRestoringData {
    guild_id: string
    timestamp: number
    roles: string[]
    nickname?: string
}
