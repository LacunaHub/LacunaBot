import { DataResolver } from 'discord.js'
import database from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import { hubSubscribe } from '../../../modules/YouTube'
import DiscordUtils from '../../utility/DiscordUtils'

export async function createYouTubeSubscription(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.youtube

    if (subscriptions.length >= 1 && !server.server.premium.available) throw new Error('LIMIT_REACHED_NO_PREMIUM')
    if (subscriptions.length >= 10) throw new Error('LIMIT_REACHED')
    if (subscriptions.some(s => s.channel_id === data.channel.id)) throw new Error('ALREADY_SUBSCRIBED')

    const youtubeSub = await database.youtubeSubs.findOne({ _id: data.channel.id })

    if (!youtubeSub) {
        const hubSubscribeResponse = await hubSubscribe(data.channel.id)

        if (hubSubscribeResponse.ok) {
            await database.youtubeSubs.create({
                _id: data.channel.id,
                channel_name: data.channel.name,
                channel_thumbnail_url: data.channel.thumbnail
            } as any)
        } else return 'youtube_subscribe_error'
    }

    let webhook: any

    try {
        webhook = await DiscordUtils.restApi.post(DiscordUtils.apiRoutes.channelWebhooks(data.notification_channel_id), {
            body: {
                name: data.channel.name,
                avatar: await DataResolver.resolveImage(data.channel.thumbnail)
            }
        })
    } catch (err) {}

    const subscription = {
        channel_id: data.channel.id,
        channel_name: data.channel.name,
        channel_thumbnail_url: data.channel.thumbnail,
        notification_channel_id: data.notification_channel_id,
        notification_message: data.notification_message,
        webhook_id: webhook?.id ?? null,
        webhook_token: webhook?.token ?? null
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.subscriptions.youtube': subscription
            }
        }
    )

    return subscription
}

export async function updateYouTubeSubscription(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.youtube
    const subscription = subscriptions.find(i => i.channel_id === data.channel_id)

    if (!subscription) throw new Error('NOT_FOUND')

    await database.servers.updateOne(
        { _id: server._id, 'modules.subscriptions.youtube.channel_id': data.channel_id },
        {
            $set: {
                'modules.subscriptions.youtube.$.notification_channel_id': data.notification_channel_id,
                'modules.subscriptions.youtube.$.notification_message': data.notification_message
            }
        }
    )

    if (subscription.notification_channel_id !== data.notification_channel_id) {
        try {
            await DiscordUtils.restApi.patch(DiscordUtils.apiRoutes.webhook(subscription.webhook_id), {
                body: {
                    channel_id: data.notification_channel_id
                }
            })
        } catch (err) {}
    }

    return data
}

export async function deleteYouTubeSubscription(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.youtube
    const subscription = subscriptions.find(s => s.channel_id === data.channel_id)

    if (!subscription) throw new Error('NOT_FOUND')

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.subscriptions.youtube': {
                    channel_id: subscription.channel_id
                }
            }
        }
    )

    const subscribedGuilds = await database.servers.find({ 'modules.subscriptions.youtube.channel_id': subscription.channel_id })

    if (!subscribedGuilds.length) {
        try {
            await hubSubscribe(subscription.channel_id, 'unsubscribe')
            await database.youtubeSubs.deleteOne({ _id: subscription.channel_id })
        } catch (err) {}
    }

    if (subscription.webhook_id) {
        try {
            await DiscordUtils.restApi.delete(DiscordUtils.apiRoutes.webhook(subscription.webhook_id, subscription.webhook_token))
        } catch (err) {}
    }

    return true
}
