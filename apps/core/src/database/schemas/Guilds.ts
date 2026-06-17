import { type Snowflake, SnowflakeUtils } from '@/utility/SnowflakeUtils.js'
import { type APIGuild } from 'discord.js'
import mongoose from 'mongoose'

const schema = new mongoose.Schema<GuildDocument>(
    {
        _id: { type: String, default: SnowflakeUtils.generate },
        data: {
            afk_channel_id: { type: String, default: null },
            afk_timeout: { type: Number, default: 60 },
            application_id: { type: String, default: null },
            approximate_member_count: { type: Number, default: null },
            approximate_presence_count: { type: Number, default: null },
            banner: { type: String, default: null },
            default_message_notifications: { type: Number, default: 0 },
            description: { type: String, default: null },
            discovery_splash: { type: String, default: null },
            emojis: { type: Array, default: [] },
            explicit_content_filter: { type: Number, default: 0 },
            features: { type: Array, default: [] },
            hub_type: { type: Number, default: null },
            icon: { type: String, default: null },
            id: { type: String, required: true },
            max_members: { type: Number, default: null },
            max_presences: { type: Number, default: null },
            max_stage_video_channel_users: { type: Number, default: null },
            max_video_channel_users: { type: Number, default: null },
            mfa_level: { type: Number, default: 0 },
            name: { type: String, required: true },
            nsfw_level: { type: Number, default: 0 },
            owner_id: { type: String, required: true },
            preferred_locale: { type: String, default: 'en-US' },
            premium_progress_bar_enabled: { type: Boolean, default: false },
            premium_subscription_count: { type: Number, default: 0 },
            premium_tier: { type: Number, default: 0 },
            public_updates_channel_id: { type: String, default: null },
            roles: { type: Array, default: [] },
            rules_channel_id: { type: String, default: null },
            safety_alerts_channel_id: { type: String, default: null },
            splash: { type: String, default: null },
            stickers: { type: Array, default: [] },
            system_channel_flags: { type: Number, default: 0 },
            system_channel_id: { type: String, default: null },
            vanity_url_code: { type: String, default: null },
            verification_level: { type: Number, default: 0 },
            widget_channel_id: { type: String, default: null },
            widget_enabled: { type: Boolean, default: false }
        },
        created_at: {
            type: Number,
            default: function () {
                // @ts-expect-error
                return SnowflakeUtils.getTimestamp(this._id)
            }
        },
        updated_at: { type: Number, default: null },
        deleted_at: { type: Number, default: null }
    },
    { versionKey: false }
)

export default mongoose.model<GuildDocument>('guilds', schema)

export interface GuildDocument extends mongoose.Document {
    _id: Snowflake
    data: APIGuild
    created_at: number
    updated_at: number | null
    deleted_at: number | null
}
