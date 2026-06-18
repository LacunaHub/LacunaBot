import mongoose from 'mongoose'

export default mongoose.model<TelegramSubDocument>(
    'telegram-subs',
    new mongoose.Schema<TelegramSubDocument>(
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

export interface TelegramSubDocument extends mongoose.Document {
    _id: number
    channel_title: string
    channel_username: string
    created_at: number
    last_message_id: number
}
