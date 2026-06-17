import { type Snowflake, SnowflakeUtils } from '@/utility/SnowflakeUtils.js'
import mongoose from 'mongoose'

const schema = new mongoose.Schema<ViolativeMessageDocument>(
    {
        _id: { type: String, default: SnowflakeUtils.generate },
        server_id: { type: String, required: true },
        author_id: { type: String, required: true },
        message_id: { type: String, required: true },
        channel_id: { type: String, required: true },
        violation_category: { type: Number, required: true },
        violation_severity_level: { type: Number, default: null },
        violation_judgement: { type: Number, default: null },
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

export default mongoose.model<ViolativeMessageDocument>('violative-messages', schema)

export interface ViolativeMessageDocument extends mongoose.Document {
    _id: Snowflake
    server_id: string
    author_id: string
    message_id: string
    channel_id: string
    violation_category: number
    violation_severity_level: ViolationSeverityLevels | null
    violation_judgement: ViolationJudgement | null
    created_at: number
}

export enum ViolationSeverityLevels {
    Low,
    Moderate,
    High,
    Severe
}

export enum ViolationJudgement {
    Ban,
    Kick,
    Mute,
    Warn
}
