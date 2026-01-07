import { ServerDocument } from '@/database/schemas/Servers'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function updateYouTubeSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const channelId: string = ctx.params.channelId,
        data = ctx.request.body

    const youtubeSubscription = server.modules.subscriptions.youtube.find(s => s.channel_id === channelId)
    if (!youtubeSubscription) ctx.throw(404, new APIError(1014))

    await database.servers.updateOne(
        { _id: server._id, 'modules.subscriptions.youtube.channel_id': data.channel_id },
        {
            $set: {
                'modules.subscriptions.youtube.$.notification_channel_id': data.notification_channel_id,
                'modules.subscriptions.youtube.$.notification_message': data.notification_message,
                'modules.subscriptions.youtube.$.options': data.options ?? []
            }
        }
    )

    if (youtubeSubscription.notification_channel_id !== data.notification_channel_id) {
        try {
            await DiscordUtils.rest.patch(DiscordUtils.restRoutes.webhook(youtubeSubscription.webhook_id), {
                body: {
                    channel_id: data.notification_channel_id
                }
            })
        } catch (err) {
            await Logger.handleError({
                module: 'YouTubeSubs',
                action: 'UpdateWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    ctx.status = 200
    ctx.body = data
}
