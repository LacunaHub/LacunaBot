import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

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
            ctx.log.error({
                module: 'YouTubeSubs',
                action: 'UpdateWebhook',
                err,
                guildId: server._id
            })
        }
    }

    ctx.status = 200
    ctx.body = data
}
