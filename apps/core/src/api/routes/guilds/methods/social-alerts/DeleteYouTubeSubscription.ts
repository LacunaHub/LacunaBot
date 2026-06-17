import { hubSubscribe } from '@/api/modules/social-alerts/YouTubeAlerts.js'
import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function deleteYouTubeSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const channelId: string = ctx.params.channelId

    const youtubeSubscription = server.modules.subscriptions.youtube.find(v => v.channel_id === channelId)
    if (!youtubeSubscription) ctx.throw(404, new APIError(1014))

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.subscriptions.youtube': {
                    channel_id: youtubeSubscription.channel_id
                }
            }
        }
    )

    const subscribedGuilds = await database.servers.find({
        'modules.subscriptions.youtube.channel_id': youtubeSubscription.channel_id
    })

    if (!subscribedGuilds.length) {
        try {
            await hubSubscribe(youtubeSubscription.channel_id, 'unsubscribe')
            await database.youtubeSubs.deleteOne({ _id: youtubeSubscription.channel_id })
        } catch (err) {
            ctx.log.error({
                module: 'YouTubeSubs',
                action: 'DeleteSubscription',
                err,
                guildId: server._id
            })

            ctx.throw(500, new APIError(5018))
        }
    }

    if (youtubeSubscription.webhook_id) {
        try {
            await DiscordUtils.rest.delete(
                DiscordUtils.restRoutes.webhook(youtubeSubscription.webhook_id, youtubeSubscription.webhook_token)
            )
        } catch (err) {
            ctx.log.error({
                module: 'YouTubeSubs',
                action: 'DeleteWebhook',
                err,
                guildId: server._id
            })
        }
    }

    ctx.status = 204
}
