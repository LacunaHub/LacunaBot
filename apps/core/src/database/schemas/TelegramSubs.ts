import { Document, Schema, model } from 'mongoose'

export default model<TelegramSubDocument>(
    'telegram-subs',
    new Schema<TelegramSubDocument>(
        {
            _id: { type: Number },
            channel_title: { type: String, required: true },
            channel_username: { type: String, required: true },
            created_at: { type: Number, default: () => Date.now() },
            last_message_id: { type: Number, default: null }
        },
        { versionKey: false }
    )
)

export interface TelegramSubDocument extends Document {
    _id: number
    channel_title: string
    channel_username: string
    created_at: number
    last_message_id: number
}
