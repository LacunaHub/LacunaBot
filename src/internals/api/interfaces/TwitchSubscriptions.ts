import { DataResolver } from 'discord.js'
import database from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import { eventSubSubscribe, eventSubUnsubscribe, ITwitchIncomingWebhook } from '../../../modules/Twitch'
import DiscordUtils from '../../utility/DiscordUtils'

export async function createTwitchSubscription(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.twitch

    if (subscriptions.length >= 1 && !server.server.premium.available) throw new Error('LIMIT_REACHED_NO_PREMIUM')
    if (subscriptions.length >= 10) throw new Error('LIMIT_REACHED')
    if (subscriptions.some(s => s.broadcaster_id == data.broadcaster.id)) throw new Error('ALREADY_SUBSCRIBED')

    const twitchSub = await database.twitchSubs.findOne({ broadcaster_id: data.broadcaster.id })

    if (!twitchSub) {
        const eventSubResponse = await eventSubSubscribe('stream.online', data.broadcaster.id)
        let eventSub: ITwitchIncomingWebhook['subscription']

        if (eventSubResponse.ok) {
            const { data } = await eventSubResponse.json()

            eventSub = data[0]
        }

        if (!eventSub) throw new Error('CANNOT_SUBSCRIBE')

        await database.twitchSubs.create({
            _id: eventSub.id,
            broadcaster_id: data.broadcaster.id,
            broadcaster_login: data.broadcaster.login,
            broadcaster_name: data.broadcaster.name,
            broadcaster_thumbnail_url: data.broadcaster.thumbnail
        } as any)
    }

    const webhook = (await DiscordUtils.restApi
        .post(DiscordUtils.apiRoutes.channelWebhooks(data.notification_channel_id), {
            body: {
                name: data.broadcaster.name,
                avatar: await DataResolver.resolveImage(data.broadcaster.thumbnail)
            }
        })
        .catch(() => {})) as any

    const subscription = {
        broadcaster_id: data.broadcaster.id,
        broadcaster_name: data.broadcaster.name,
        broadcaster_thumbnail_url: data.broadcaster.thumbnail,
        notification_channel_id: data.notification_channel_id,
        notification_message: data.notification_message,
        webhook_id: webhook?.id ?? null,
        webhook_token: webhook?.token ?? null,
        display_stream_preview: data.display_stream_preview
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.subscriptions.twitch': subscription
            }
        }
    )

    return subscription
}

export async function updateTwitchSubscription(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.twitch
    const subscription = subscriptions.find(i => i.broadcaster_id == data.broadcaster_id)

    if (!subscription) throw new Error('NOT_FOUND')

    await database.servers.updateOne(
        { _id: server._id, 'modules.subscriptions.twitch.broadcaster_id': data.broadcaster_id },
        {
            $set: {
                'modules.subscriptions.twitch.$.notification_channel_id': data.notification_channel_id,
                'modules.subscriptions.twitch.$.notification_message': data.notification_message,
                'modules.subscriptions.twitch.$.display_stream_preview': data.display_stream_preview
            }
        }
    )

    if (subscription.notification_channel_id != data.notification_channel_id) {
        await DiscordUtils.restApi
            .patch(DiscordUtils.apiRoutes.webhook(subscription.webhook_id), {
                body: {
                    channel_id: data.notification_channel_id
                }
            })
            .catch(() => {})
    }

    return data
}

export async function deleteTwitchSubscription(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.twitch
    const subscription = subscriptions.find(s => s.broadcaster_id == data.broadcaster_id)

    if (!subscription) throw new Error('NOT_FOUND')

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.subscriptions.twitch': {
                    broadcaster_id: subscription.broadcaster_id
                }
            }
        }
    )

    const subscribedGuilds = await database.servers.find({ 'modules.subscriptions.twitch.broadcaster_id': subscription.broadcaster_id })

    if (!subscribedGuilds.length) {
        const twitchSub = await database.twitchSubs.findOne({ broadcaster_id: subscription.broadcaster_id })

        await eventSubUnsubscribe(twitchSub?._id).catch(() => {})
        await database.twitchSubs.deleteMany({ broadcaster_id: subscription.broadcaster_id })
    }

    if (subscription.webhook_id) await DiscordUtils.restApi.delete(DiscordUtils.apiRoutes.webhook(subscription.webhook_id, subscription.webhook_token)).catch(() => {})

    return data
}
