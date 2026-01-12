import { ServerBanDocument } from '@/database/schemas/ServerBans'
import { Context } from 'koa'
import { FilterQuery } from 'mongoose'
import database from '../../../../database'

export default async function getUserBans(ctx: Context) {
    const userId = ctx.params.userId
    let page = Math.abs(+ctx.query.page || 0),
        limit = Math.abs(+ctx.query.limit || 100)

    if (limit < 2) limit = 2
    else if (limit > 100) limit = 100

    const filterQuery: FilterQuery<ServerBanDocument> = { user_id: userId }
    const bans = (await database.serverBans
            .find(filterQuery)
            .sort({ created_at: 1 })
            .skip(limit * page)
            .limit(limit)) as ServerBanDocument[],
        banCount = await database.serverBans.countDocuments(filterQuery)

    ctx.status = 200
    ctx.body = {
        page_count: Math.ceil(banCount / limit),
        result_count: banCount,
        results: bans.map(v => {
            return {
                id: v._id,
                guild_id: v.guild_id,
                reason: v.reason,
                removed_at: v.removed_at,
                created_at: v.created_at
            }
        })
    }
}
