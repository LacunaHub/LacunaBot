import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { APIWebhook, DataResolver } from 'discord.js'
import database from '../../../database'
import { ITwitchIncomingWebhook, eventSubSubscribe, eventSubUnsubscribe, getEventSubsByUserId } from '../../../modules/Twitch'
import Logger from '../../Logger'
import DiscordUtils from '../../utility/DiscordUtils'
import APIError from '../utility/APIError'

export async function createTwitchSubscription(server: ServerDocument, data: any) {
    const subscriptions = server.modules.subscriptions.twitch

    if (subscriptions.length >= 1 && !server.premium.available) throw new APIError(3009)
    if (subscriptions.length >= 10) throw new APIError(3010)
    if (subscriptions.some(s => s.broadcaster_id === data.broadcaster.id)) throw new APIError(2006)

    let webhook: APIWebhook

    try {
        webhook = (await DiscordUtils.restApi.post(DiscordUtils.apiRoutes.channelWebhooks(data.notification_channel_id), {
            body: {
                name: data.broadcaster.name,
                avatar: await DataResolver.resolveImage(data.broadcaster.thumbnail)
            }
        })) as any
    } catch (err) {
        await Logger.handleError({
            module: 'TwitchSubs',
            action: 'CreateWebhook',
            error: err,
            guild_id: server._id
        })

        throw new APIError(5009)
    }

    const twitchSub = await database.twitchSubs.findOne({ broadcaster_id: data.broadcaster.id })

    if (!twitchSub) {
        let eventSubResponse = await eventSubSubscribe('stream.online', data.broadcaster.id),
            eventSub: ITwitchIncomingWebhook['subscription']

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

    return subscription
}

export async function updateTwitchSubscription(server: ServerDocument, data: any) {
    const subscription = server.modules.subscriptions.twitch.find(i => i.broadcaster_id === data.broadcaster_id)

    if (!subscription) throw new APIError(1015)

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

    if (subscription.notification_channel_id !== data.notification_channel_id) {
        try {
            await DiscordUtils.restApi.patch(DiscordUtils.apiRoutes.webhook(subscription.webhook_id), {
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

    return data
}

export async function deleteTwitchSubscription(server: ServerDocument, data: any) {
    const subscription = server.modules.subscriptions.twitch.find(s => s.broadcaster_id === data.broadcaster_id)

    if (!subscription) throw new APIError(1015)

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

        try {
            await eventSubUnsubscribe(twitchSub?._id)
            await database.twitchSubs.deleteMany({ broadcaster_id: subscription.broadcaster_id })
        } catch (err) {
            await Logger.handleError({
                module: 'TwitchSubs',
                action: 'DeleteEventSub',
                error: err,
                guild_id: server._id
            })

            throw new APIError(5016)
        }
    }

    if (subscription.webhook_id) {
        try {
            await DiscordUtils.restApi.delete(DiscordUtils.apiRoutes.webhook(subscription.webhook_id, subscription.webhook_token))
        } catch (err) {
            await Logger.handleError({
                module: 'TwitchSubs',
                action: 'DeleteWebhook',
                error: err,
                guild_id: server._id
            })
        }
    }

    return data
}
