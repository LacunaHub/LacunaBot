import { Document, Schema, model } from 'mongoose'

export default model<ICustomCommand>(
    'custom-commands',
    new Schema<ICustomCommand>(
        {
            _id: { type: String },
            published: { type: Boolean, default: false },
            author_id: { type: String, required: true },
            guild_id: { type: String, required: true },
            name: { type: String, required: true },
            description: { type: String, required: true },
            total_uses: { type: Number, default: 0 },
            uses: { type: Array, default: [] },
            data: { type: String, required: true },
            created_at: { type: Number, default: () => Date.now() },
            rejection_reason: { type: String, default: null }
        },
        { versionKey: false }
    )
)

export interface ICustomCommand extends Document {
    _id: string
    published: boolean
    author_id: string
    guild_id: string
    name: string
    description: string
    total_uses: number
    uses: Array<{ guild_id: string; timestamp: number }>
    data: string
    created_at: number
    rejection_reason: string
}
