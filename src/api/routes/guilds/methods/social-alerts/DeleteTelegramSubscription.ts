import { ServerDocument } from '@/database/schemas/Servers'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function deleteTelegramSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const channelId: number = +ctx.params.channelId

    const tgSubscription = server.modules.subscriptions.telegram.find(v => v.channel_id === channelId)
    if (!tgSubscription) ctx.throw(404, new APIError(1014))

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.subscriptions.telegram': {
                    channel_id: tgSubscription.channel_id
                }
            }
        }
    )

    const subscribedGuilds = await database.servers.find({
        'modules.subscriptions.telegram.channel_id': tgSubscription.channel_id
    })

    if (!subscribedGuilds.length) {
        await database.telegramSubs.deleteOne({ _id: tgSubscription.channel_id })
    }

    if (tgSubscription.webhook_id) {
        try {
            await DiscordUtils.rest.delete(DiscordUtils.restRoutes.webhook(tgSubscription.webhook_id, tgSubscription.webhook_token))
        } catch (err) {
            await Logger.handleError({
                module: 'TelegramSubs',
                action: 'DeleteWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    ctx.status = 204
}
