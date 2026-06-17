import mongoose from 'mongoose'

export default mongoose.model<TwitchSubDocument>(
    'twitch-subs',
    new mongoose.Schema<TwitchSubDocument>(
        {
            _id: { type: String, required: true },
            broadcaster_id: { type: String, required: true },
            broadcaster_login: { type: String, required: true },
            broadcaster_name: { type: String, required: true },
            broadcaster_thumbnail_url: { type: String, default: null },
            created_timestamp: { type: Number, default: () => Date.now() },
            last_eventsub_message_id: { type: String, default: null }
        },
        { versionKey: false }
    )
)

export interface TwitchSubDocument extends mongoose.Document {
    _id: string
    broadcaster_id: string
    broadcaster_login: string
    broadcaster_name: string
    broadcaster_thumbnail_url: string
    created_timestamp: number
    last_eventsub_message_id: string
}
