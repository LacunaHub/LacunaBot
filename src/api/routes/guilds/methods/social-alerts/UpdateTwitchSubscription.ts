import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function updateTwitchSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const channelId: string = ctx.params.channelId,
        data = ctx.request.body

    const twitchSubscription = server.modules.subscriptions.twitch.find(v => v.broadcaster_id === channelId)
    if (!twitchSubscription) ctx.throw(404, new APIError(1014))

    await database.servers.updateOne(
        { _id: server._id, 'modules.subscriptions.twitch.broadcaster_id': data.broadcaster_id },
        {
            $set: {
                'modules.subscriptions.twitch.$.notification_channel_id': data.notification_channel_id,
                'modules.subscriptions.twitch.$.notification_message': data.notification_message,
                'modules.subscriptions.twitch.$.display_stream_preview': data.display_stream_preview,
                'modules.subscriptions.twitch.$.options': data.options ?? []
            }
        }
    )

    if (twitchSubscription.notification_channel_id !== data.notification_channel_id) {
        try {
            await DiscordUtils.rest.patch(DiscordUtils.restRoutes.webhook(twitchSubscription.webhook_id), {
                body: {
                    channel_id: data.notification_channel_id
                }
            })
        } catch (err) {
            await Logger.handleError({
                module: 'TwitchSubs',
                action: 'UpdateWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    ctx.status = 200
    ctx.body = data
}
