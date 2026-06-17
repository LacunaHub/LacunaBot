import { searchChannels } from '@/api/modules/social-alerts/TwitchAlerts.js'
import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { type Context } from 'koa'

export default async function searchTwitchChannels(ctx: Context) {
    const guildId = ctx.query.gid as string,
        query = ctx.query.q as string

    if (!guildId || !query) {
        ctx.throw(400, new APIError())
    }

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    let channels = await searchChannels(query)
    const added = server.modules.subscriptions.twitch

    if (!channels?.length) {
        channels = []
    }

    ctx.status = 200
    ctx.body = channels.filter(channel => !added.some(s => s.broadcaster_id == channel.id))
}
