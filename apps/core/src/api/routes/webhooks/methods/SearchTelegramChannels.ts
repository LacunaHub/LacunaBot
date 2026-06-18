import { searchChannels } from '@/api/modules/social-alerts/TelegramAlerts.js'
import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { type Context } from 'koa'

export default async function searchTelegramChannels(ctx: Context) {
    const guildId = ctx.query.gid as string
    const query = ctx.query.q as string

    if (!guildId || !query) ctx.throw(400, new APIError())

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const channel = await searchChannels(query)
    const added = server.modules.subscriptions.telegram.some(i => i.channel_id === channel?.id)

    ctx.status = 200
    ctx.body = channel && !added ? [channel] : []
}
