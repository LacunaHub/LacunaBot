import { Snowflake, SnowflakeUtils } from '@/utility/SnowflakeUtils'
import { Document, model, Schema } from 'mongoose'

export default model<ReportDocument>(
    'reports',
    new Schema<ReportDocument>(
        {
            _id: { type: String, default: SnowflakeUtils.generate },
            type: { type: Number, required: true },
            complainant_id: { type: String, required: true },
            accused_id: { type: String, required: true },
            content: { type: String, required: true },
            checked_at: { type: Number, default: null },
            metadata: {},
            created_at: {
                type: Number,
                default: function () {
                    return SnowflakeUtils.getTimestamp(this._id)
                }
            }
        },
        { versionKey: false }
    )
)

export type ReportDocument = GuildReportDocument | UserReportDocument

export interface BaseReportDocument extends Document {
    _id: Snowflake
    type: ReportType
    complainant_id: string
    accused_id: string
    content: string
    checked_at: number
    metadata: Record<string, any>
    created_at: number
}

export enum ReportType {
    Guild,
    User,
    Review,
    ReviewComment
}

export interface GuildReportDocument extends BaseReportDocument {
    type: ReportType.Guild
    metadata: GuildReportMetadata
}

export interface GuildReportMetadata {
    reported_categories: GuildReportMetadataReportedCategory[]
    violations_are_detected: boolean | null
    conclusion: string | null
}

export type GuildReportMetadataReportedCategory = 'Icon' | 'Name' | 'Description' | 'ReviewFraud'

export interface UserReportDocument extends BaseReportDocument {
    type: ReportType.User
    metadata: UserReportMetadata
}

export interface UserReportMetadata {
    from_guild_id: string
    category: UserReportMetadataCategory | null
    recommended_action: UserReportMetadataRecommendedAction | null
}

export enum UserReportMetadataCategory {
    AggressionAndInsult,
    Spam,
    Fraud,
    IncitementToDiscord,
    CopyrightInfringement,
    UnauthorizedAccess,
    PornographyAndObscenity,
    ViolenceAndAbuse,
    Disinformation,
    IllegalActivity,
    MultiAccounting,
    ViolationOfCommunityRules,
    DisclosureOfPersonalInformation,
    Meaningless,
    Toxicity,
    Other
}

export enum UserReportMetadataRecommendedAction {
    Nothing,
    Ban,
    Kick,
    Mute,
    Warn
}
