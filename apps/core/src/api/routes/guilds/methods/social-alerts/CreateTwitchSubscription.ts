import {
    eventSubSubscribe,
    eventSubUnsubscribe,
    getEventSubsByUserId,
    type TwitchIncomingWebhook
} from '@/api/modules/social-alerts/TwitchAlerts.js'
import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { bufferToDataURL, fetchFile } from '@/internals/utility/Utils.js'
import { type APIWebhook } from 'discord.js'
import { type Context } from 'koa'

export default async function createTwitchSubscription(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data = ctx.request.body

    if (server.modules.subscriptions.twitch.length >= 10) ctx.throw(406, new APIError(3008))
    if (server.modules.subscriptions.twitch.some(v => v.broadcaster_id === data.broadcaster.id))
        ctx.throw(409, new APIError(2005))

    let webhook: APIWebhook
    try {
        const avatar = await fetchFile(data.broadcaster.thumbnail)

        webhook = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelWebhooks(data.notification_channel_id), {
            body: {
                name: data.broadcaster.name,
                avatar: bufferToDataURL(Buffer.from(avatar.data.buffer))
            }
        })) as any
    } catch (err) {
        ctx.log.error({
            module: 'TwitchSubs',
            action: 'CreateWebhook',
            err,
            guildId: server._id
        })

        ctx.throw(500, new APIError(5009))
    }

    const twitchSub = await database.twitchSubs.findOne({ broadcaster_id: data.broadcaster.id })

    if (!twitchSub) {
        let eventSubResponse = await eventSubSubscribe('stream.online', data.broadcaster.id),
            eventSub!: TwitchIncomingWebhook['subscription']

        if (eventSubResponse.status === 409) {
            const getSubsResponse = await getEventSubsByUserId(data.broadcaster.id)

            if (getSubsResponse.ok) {
                const json = await getSubsResponse.json()

                for (const sub of json.data) {
                    await eventSubUnsubscribe(sub.id)
                }

                eventSubResponse = await eventSubSubscribe('stream.online', data.broadcaster.id)
            }
        }

        if (eventSubResponse.ok) {
            const json = await eventSubResponse.json()

            eventSub = json.data[0]
        }

        if (!eventSub) throw new APIError(5015)

        await database.twitchSubs.create({
            _id: eventSub.id,
            broadcaster_id: data.broadcaster.id,
            broadcaster_login: data.broadcaster.login,
            broadcaster_name: data.broadcaster.name,
            broadcaster_thumbnail_url: data.broadcaster.thumbnail
        } as any)
    }

    const subscription = {
        broadcaster_id: data.broadcaster.id,
        broadcaster_name: data.broadcaster.name,
        broadcaster_thumbnail_url: data.broadcaster.thumbnail,
        notification_channel_id: data.notification_channel_id,
        notification_message: data.notification_message,
        webhook_id: webhook?.id ?? null,
        webhook_token: webhook?.token ?? null,
        display_stream_preview: data.display_stream_preview,
        options: data.options ?? []
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.subscriptions.twitch': subscription
            }
        }
    )

    ctx.status = 200
    ctx.body = subscription
}
