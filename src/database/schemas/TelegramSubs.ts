import { Document, Schema, model } from 'mongoose'

export default model<ITelegramSub>(
    'telegram-subs',
    new Schema<ITelegramSub>(
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

export interface ITelegramSub extends Document {
    _id: number
    channel_title: string
    channel_username: string
    created_at: number
    last_message_id: number
}
