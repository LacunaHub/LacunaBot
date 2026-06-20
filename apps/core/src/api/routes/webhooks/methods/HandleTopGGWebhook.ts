import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { type Context } from 'koa'

export default async function handleTopGGWebhook(ctx: Context) {
    const authorization = ctx.request.headers['authorization'] as string

    if (authorization !== process.env.LCN_TOP_GG_WEBHOOK_SECRET) {
        ctx.throw(403, new APIError(4001))
    }

    const data = ctx.request.body as TopGGWebhookData

    if (!data || data.bot !== process.env.LCN_DISCORD_CLIENT_ID) {
        ctx.throw(400, new APIError())
    }

    const user = await database.users.findOne({ _id: data.user }).lean()

    if (!user) {
        ctx.throw(404, new APIError(1001))
    }

    if (data.type === 'upvote') {
        await database.users.updateOne({ _id: data.user }, { $inc: { tokens: 1 } })
    }

    ctx.status = 204
}

export interface TopGGWebhookData {
    bot: string
    user: string
    type: TopGGWebhookType
    isWeekend: boolean
    query?: string
}

export type TopGGWebhookType = 'upvote' | 'test'
