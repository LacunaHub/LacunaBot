import { ServerDocument } from '@/database/schemas/Servers'
import { APIWebhook, resolveImage } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../../database'
import { hubSubscribe } from '../../../../modules/social-alerts/YouTubeAlerts'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function createYouTubeSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data = ctx.request.body

    if (server.modules.subscriptions.youtube.length >= 1 && !server.premium.available) ctx.throw(402, new APIError(3007))
    if (server.modules.subscriptions.youtube.length >= 10) ctx.throw(406, new APIError(3008))
    if (server.modules.subscriptions.youtube.some(v => v.channel_id === data.channel.id)) ctx.throw(409, new APIError(2005))

    let webhook: APIWebhook
    try {
        webhook = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelWebhooks(data.notification_channel_id), {
            body: {
                name: data.channel.name,
                avatar: await resolveImage(data.channel.thumbnail)
            }
        })) as any
    } catch (err) {
        ctx.log.error({
            module: 'YouTubeSubs',
            action: 'CreateWebhook',
            err,
            guildId: server._id
        })

        ctx.throw(500, new APIError(5009))
    }

    const youtubeSub = await database.youtubeSubs.findOne({ _id: data.channel.id })

    if (!youtubeSub) {
        const hubSubscribeResponse = await hubSubscribe(data.channel.id)

        if (hubSubscribeResponse.ok) {
            await database.youtubeSubs.create({
                _id: data.channel.id,
                channel_name: data.channel.name,
                channel_thumbnail_url: data.channel.thumbnail
            } as any)
        } else {
            ctx.throw(500, new APIError(5017))
        }
    }

    const subscription = {
        channel_id: data.channel.id,
        channel_name: data.channel.name,
        channel_thumbnail_url: data.channel.thumbnail,
        notification_channel_id: data.notification_channel_id,
        notification_message: data.notification_message,
        webhook_id: webhook?.id ?? null,
        webhook_token: webhook?.token ?? null,
        options: data.options ?? []
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.subscriptions.youtube': subscription
            }
        }
    )

    ctx.status = 200
    ctx.body = subscription
}
