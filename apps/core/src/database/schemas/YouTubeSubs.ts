import mongoose from 'mongoose'

export default mongoose.model<YouTubeSubDocument>(
    'youtube-subs',
    new mongoose.Schema<YouTubeSubDocument>(
        {
            _id: { type: String, required: true },
            channel_name: { type: String, required: true },
            channel_thumbnail_url: { type: String, default: null },
            expiration_timestamp: { type: Number, default: null },
            created_timestamp: { type: Number, default: () => Date.now() },
            last_video_id: { type: String, default: null }
        },
        { versionKey: false }
    )
)

export interface YouTubeSubDocument extends mongoose.Document {
    _id: string
    channel_name: string
    channel_thumbnail_url: string
    expiration_timestamp: number
    created_timestamp: number
    last_video_id: string
}
