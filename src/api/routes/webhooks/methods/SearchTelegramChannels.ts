import { Context } from 'koa'
import database from '../../../../database'
import { searchChannels } from '../../../modules/social-alerts/TelegramAlerts'
import APIError from '../../../utility/APIError'

export default async function searchTelegramChannels(ctx: Context) {
    const guildId = ctx.query.gid as string
    const query = ctx.query.q as string

    if (!guildId || !query) ctx.throw(400, new APIError())

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const channel = await searchChannels(query)
    const added = server.modules.subscriptions.telegram.some(i => i.channel_id === channel.id)

    ctx.status = 200
    ctx.body = channel && !added ? [channel] : []
}
