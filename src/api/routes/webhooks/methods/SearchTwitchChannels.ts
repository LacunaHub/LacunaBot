import { Context } from 'koa'
import database from '../../../../database'
import { searchChannels } from '../../../modules/social-alerts/TwitchAlerts'
import APIError from '../../../utility/APIError'

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
