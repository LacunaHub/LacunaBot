import { type Snowflake, SnowflakeUtils } from '@/utility/SnowflakeUtils.js'
import mongoose from 'mongoose'

export default mongoose.model<ServerBanDocument>(
    'server-bans',
    new mongoose.Schema<ServerBanDocument>(
        {
            _id: { type: String, default: SnowflakeUtils.generate },
            guild_id: { type: String, required: true },
            user_id: { type: String, required: true },
            reason: { type: String, default: null },
            removed_at: { type: Number, default: null },
            created_at: {
                type: Number,
                default: function () {
                    // @ts-expect-error
                    return SnowflakeUtils.getTimestamp(this._id)
                }
            }
        },
        { versionKey: false }
    )
)

export interface ServerBanDocument extends mongoose.Document {
    _id: Snowflake
    guild_id: string
    user_id: string
    reason: string | null
    removed_at: number | null
    created_at: number
}
