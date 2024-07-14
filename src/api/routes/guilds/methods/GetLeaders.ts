import { ServerDocument, UserData, UserLevel, UserServerProfile, UserWallet } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../database'
import APIError from '../../../utility/APIError'
import { isGuildMember, UserState } from '../../../utility/Authentication'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function getLeaders(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const guildId = ctx.params.guildId
    let page = Math.abs(+ctx.query.page || 0),
        limit = Math.abs(+ctx.query.limit || 100),
        sortBy = (ctx.query.sortBy as string) || 'Level',
        orderBy = (ctx.query.orderBy as string) || 'Desc'

    if (limit < 2) limit = 2
    else if (limit > 100) limit = 100

    let searchBy = 'activities.levels'
    switch (sortBy) {
        case 'MessageCount':
            sortBy = 'data.activity.total_messages'
            break

        case 'VoiceTime':
            sortBy = 'data.activity.total_voice_time'
            break

        case 'Currencies':
            searchBy = 'activities.wallets'
            sortBy = 'data.currencies.amount'
            break

        default:
            sortBy = 'data.experience.total'
            break
    }

    if (searchBy === 'activities.levels' && !server.modules.levels.active && !server.modules.levels.voice) ctx.throw(406, new APIError(4026))
    if (searchBy === 'activities.wallets' && !server.modules.economy.active) ctx.throw(406, new APIError(4027))

    if (!server.web_page.public_leaderboard) {
        const currentUser: UserState = ctx.state.user
        if (!currentUser) ctx.throw(403, new APIError(4025))

        const rootUsers = await database.getRootUsers(),
            isRootUser = rootUsers.includes(currentUser.id)

        if (!isRootUser) {
            const isMember = await isGuildMember(guildId, currentUser.id)
            if (!isMember) ctx.throw(403, new APIError(4025))
        }
    }

    // @ts-ignore
    const userAggregation: UserAggregation[] = await database.users.aggregate([
        { $match: { [`${searchBy}.guild_id`]: guildId } },
        {
            $addFields: {
                data: {
                    $filter: {
                        input: `$${searchBy}`,
                        as: 'prop',
                        cond: { $eq: ['$$prop.guild_id', guildId] }
                    }
                }
            }
        },
        { $unwind: { path: '$data', preserveNullAndEmptyArrays: true } },
        { $project: { user: 1, server_profiles: 1, data: 1 } },
        { $sort: { [sortBy]: orderBy === 'Asc' ? 1 : -1 } },
        {
            $facet: {
                results: [{ $skip: limit * page }, { $limit: limit }],
                pagination: [
                    {
                        $count: 'result_count'
                    },
                    {
                        $addFields: {
                            page_count: { $ceil: { $divide: ['$result_count', limit] } }
                        }
                    }
                ]
            }
        },
        { $unwind: '$pagination' }
    ])
    const aggregation = userAggregation[0],
        pageCount = aggregation?.pagination?.page_count ?? 0,
        resultCount = aggregation?.pagination?.result_count ?? 0

    let resultType = 0
    switch (searchBy) {
        case 'activities.levels':
            resultType = 1
            break

        case 'activities.wallets':
            resultType = 2
            break
    }

    const results =
        aggregation?.results?.map((v, i, arr) => {
            const serverProfile = v.server_profiles?.find(vv => vv.guild_id === guildId)
            let avatarURL: string = null

            if (typeof serverProfile?.avatar === 'string') avatarURL = DiscordUtils.rest.cdn.guildMemberAvatar(guildId, v._id, serverProfile.avatar)
            if (typeof avatarURL !== 'string' && typeof v.user.avatar === 'string') avatarURL = DiscordUtils.rest.cdn.avatar(v._id, v.user.avatar)

            let rank = Math.min((page + 1) * limit, resultCount) - (arr.length - (i + 1))
            if (orderBy === 'Asc') rank = resultCount - (rank - 1)

            const user = {
                id: v._id,
                username: v.user.username,
                avatar_url: avatarURL,
                display_name: serverProfile?.nickname ?? v.user.global_name
            }

            if ('experience' in v.data)
                return {
                    user,
                    rank,
                    data: {
                        total_exp: v.data.experience.total,
                        current_exp: v.data.experience.current,
                        current_level: v.data.experience.level,
                        counted_messages: v.data.activity.total_messages,
                        counted_voice_time: v.data.activity.total_voice_time
                    }
                }

            if ('currencies' in v.data)
                return {
                    user,
                    rank,
                    data: v.data.currencies.reduce((x, y) => {
                        const currency = server.modules.economy.currencies.find(v => v.id === y.id)

                        x[y.id] = { currency_name: currency?.name ?? null, currency_symbol: currency?.symbol ?? null, amount: y.amount }
                        return x
                    }, {})
                }

            return { user, rank }
        }) ?? []

    ctx.status = 200
    ctx.body = {
        page_count: pageCount,
        result_type: resultType,
        result_count: resultCount,
        results
    }
}

interface UserAggregation {
    results: Array<{
        _id: string
        user: UserData
        server_profiles?: UserServerProfile[]
        data?: UserLevel | UserWallet
    }>
    pagination: {
        result_count: number
        page_count: number
    }
}
