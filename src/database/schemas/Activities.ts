import { Schema, model, Document } from 'mongoose'

export default model<IActivities>(
    'activities',
    new Schema<IActivities>({
        _id: { type: String },
        levels: { type: Array, default: [] },
        wallets: { type: Array, default: [] },
        created_at: { type: Number, default: () => Date.now() }
    }, { versionKey: false })
)

export interface IActivities extends Document {
    _id: string
    levels: Level[],
    wallets: Wallet[]
}

export interface Level {
    user_id: string
    experience: {
        total: number
        current: number
        level: number
    }
    activity: {
        text: {
            total_messages: number
            last_message_at: number
        }
        voice: {
            total_time: number
            connected_at?: number
            disconnected_at?: number
        }
    }
}

export interface Wallet {
    user_id: string
    currencies: WalletCurrency[]
    transactions: WalletTransaction[]
    activity: {
        last_message_at: number
        voice_connected_at: number
    }
}

export interface WalletCurrency {
    id: string
    amount: number
}

export interface WalletTransaction {
    type: WalletTransactionType
    amount: number
    details: string
    timestamp: number
}

export type WalletTransactionType = 'PURCHASE' | 'SALE' | 'TRANSFER_TO' | 'TRANSFER_FROM' | 'EXCHANGE'