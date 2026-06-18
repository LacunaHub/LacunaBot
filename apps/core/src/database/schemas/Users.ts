import mongoose, { type FilterQuery } from 'mongoose'

const schema = new mongoose.Schema<UserDocument, UserModel>(
    {
        _id: { type: String },
        user: {
            username: { type: String, default: null },
            discriminator: { type: String, default: null },
            avatar: { type: String, default: null },
            flags: { type: Number, default: 0 },
            global_name: { type: String, default: null },
            email: { type: String, default: null }
        },
        premium: {
            available: { type: Boolean, default: false },
            expiration_timestamp: { type: Number, default: null },
            last_charge_timestamp: { type: Number, default: null },
            for_how_long: { type: Number, default: 0 }
        },
        activities: {
            levels: { type: [], default: [] },
            wallets: { type: [], default: [] }
        },
        restoring_data: { type: [], default: [] },
        tokens: { type: Number, default: 0 },
        server_profiles: { type: [], default: [] },
        created_at: { type: Number, default: () => Date.now() }
    },
    { versionKey: false }
)

schema.static(
    'fetch',
    async function fetch(filter: FilterQuery<UserDocument>, defaultValues: Partial<UserDocument> = {}) {
        let document = await this.findOne(filter)

        if (!document) {
            try {
                document = await this.create({ ...filter, ...defaultValues })
            } catch (err) {
                document = null
            }
        }

        return document
    }
)

schema.static('fetchLevel', async function fetchLevel(user: UserDocument, guildId: string) {
    let userLevel = user.activities.levels.find(i => i.guild_id === guildId)

    if (!userLevel) {
        userLevel = {
            guild_id: guildId,
            experience: { total: 0, current: 0, level: 0 },
            activity: {
                total_messages: 0,
                last_message_at: null,
                total_voice_time: 0,
                voice_connected_at: null
            }
        }

        await this.updateOne(
            { _id: user._id },
            {
                $push: { 'activities.levels': userLevel }
            }
        )
    }

    return userLevel
})

schema.static('fetchWallet', async function fetchWallet(user: UserDocument, guildId: string) {
    let userWallet = user.activities.wallets.find(i => i.guild_id === guildId)

    if (!userWallet) {
        userWallet = {
            guild_id: guildId,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }

        await this.updateOne(
            { _id: user._id },
            {
                $push: { 'activities.wallets': userWallet }
            }
        )
    }

    return userWallet
})

schema.static(
    'fetchServerProfile',
    async function fetchServerProfile(
        user: UserDocument,
        guildId: string,
        member: Omit<UserServerProfile, 'guild_id'>
    ) {
        let userServerProfile = user.server_profiles.find(v => v.guild_id === guildId)

        if (!userServerProfile) {
            userServerProfile = {
                guild_id: guildId,
                accent_color: member.accent_color ?? 0,
                avatar: member.avatar ?? null,
                banner: null,
                nickname: member.nickname ?? null
            }

            await this.updateOne(
                { _id: user._id },
                {
                    $push: { server_profiles: userServerProfile }
                }
            )
        }

        const updateData: mongoose.FilterQuery<UserDocument> = {}

        if (userServerProfile.accent_color !== member.accent_color) {
            userServerProfile.accent_color = updateData['accent_color'] = member.accent_color
        }

        if (userServerProfile.avatar !== member.avatar) {
            userServerProfile.avatar = updateData['avatar'] = member.avatar
        }

        if (userServerProfile.nickname !== member.nickname) {
            userServerProfile.nickname = updateData['nickname'] = member.nickname
        }

        if (Object.keys(updateData).length) {
            const data = Object.keys(updateData).reduce(
                (x, y) => {
                    x[`server_profiles.$.${y}`] = updateData[y]
                    return x
                },
                {} as Record<string, any>
            )

            if (typeof data === 'object' && data !== null) {
                await this.updateOne(
                    { _id: user._id, 'server_profiles.guild_id': guildId },
                    {
                        $set: data
                    }
                )
            }
        }

        return userServerProfile
    }
)

export default mongoose.model<UserDocument, UserModel>('users', schema)

export interface UserDocument extends mongoose.Document {
    _id: string
    user: UserData
    premium: {
        available: boolean
        expiration_timestamp: number
        last_charge_timestamp: number
        for_how_long: number
    }
    activities: {
        levels: UserLevel[]
        wallets: UserWallet[]
    }
    restoring_data: UserRestoringData[]
    tokens?: number
    server_profiles: UserServerProfile[]
    created_at: number
}

export interface UserData {
    username: string
    /** @deprecated */
    discriminator?: string | null
    avatar: string | null
    flags: number
    global_name: string | null
    email?: string | null
}

export interface UserLevel {
    guild_id: string
    experience: {
        total: number
        current: number
        level: number
    }
    activity: {
        total_messages: number
        last_message_at: number | null
        total_voice_time: number
        voice_connected_at: number | null
    }
    received_awards?: string[]
}

export interface UserWallet {
    guild_id: string
    currencies: WalletCurrency[]
    transactions: WalletTransaction[]
    activity: {
        last_message_at: number
        voice_connected_at: number
    }
}

export interface WalletCurrency {
    id: string
    amount: number
}

export interface WalletTransaction {
    type: WalletTransactionType
    amount: number
    details: string
    timestamp: number
}

export type WalletTransactionType = 'PURCHASE' | 'SALE' | 'TRANSFER_TO' | 'TRANSFER_FROM' | 'EXCHANGE'

export interface UserRestoringData {
    guild_id: string
    timestamp: number
    roles: string[]
    nickname?: string
}

export interface UserServerProfile {
    guild_id: string
    accent_color: number
    avatar: string | null
    banner: string | null
    nickname: string | null
}

export interface UserModel extends mongoose.Model<UserDocument> {
    fetch(filter: mongoose.FilterQuery<UserDocument>, defaultValues?: Partial<UserDocument>): Promise<UserDocument>
    fetchLevel(user: UserDocument, guildId: string): Promise<UserLevel>
    fetchWallet(user: UserDocument, guildId: string): Promise<UserWallet>
    fetchServerProfile(
        user: UserDocument,
        guildId: string,
        member: Omit<UserServerProfile, 'guild_id'>
    ): Promise<UserServerProfile>
}
