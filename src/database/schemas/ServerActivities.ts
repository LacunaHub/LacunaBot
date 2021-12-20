import { Schema, model, Document } from 'mongoose'

export default model<ServerActivitiesDocument>(
    'ServerActivities',
    new Schema<ServerActivitiesDocument>({
        _id: { type: String },
        levels: { type: Array, default: [] },
        created_at: { type: Number, default: () => Date.now() }
    }, { versionKey: false })
)

export interface ServerActivitiesDocument extends Document {
    _id: string
    levels: LevelActivities[]
}

export interface LevelActivities {
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