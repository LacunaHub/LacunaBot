import fetch from 'node-fetch'
import db from '../database'
import { handleModuleExecutionData } from '../events/system/ModuleExecution'
import logger from '../internals/Logger'
import { apiRoutes, restApi } from '../internals/utility/DiscordUtils'
import Replacer from './Replacer'

export async function searchChannels(query: string) {
    logger.log(`[Twitch] Searching channels with query "${query}"`)
    const response = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURI(query)}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
        }
    })

    if (response.ok) {
        const { data } = (await response.json()) as TwitchSearchResponse

        if (data?.length) {
            logger.log(`[Twitch] Found ${data.length} channels for query "${query}"`)

            return data.map(i => ({ id: i.id, name: i.display_name, login: i.broadcaster_login, thumbnail: i.thumbnail_url }))
        }

        logger.log(`[Twitch] Query "${query}" gave not search results`)

        return []
    }

    return []
}

export function eventSubSubscribe(type: string, user_id: string) {
    return fetch(`https://api.twitch.tv/helix/eventsub/subscriptions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type,
            version: '1',
            condition: { broadcaster_user_id: user_id },
            transport: {
                method: 'webhook',
                callback: `${process.env.API_URL}/subscriptions/twitch/eventsub-webhook`,
                secret: process.env.TWITCH_SIGNING_SECRET
            }
        })
    })
}

export function eventSubUnsubscribe(subscription_id: string) {
    return fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscription_id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
        }
    })
}

export async function getStream(user_id: string) {
    logger.log(`[Twitch] Getting stream of user "${user_id}"`)
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
        }
    })

    if (res.status === 200) {
        const { data } = (await res.json()) as TwitchStreamResponse
        const stream = data[0]

        if (stream) {
            logger.log(`[Twitch] Stream of user "${user_id}" found`)

            return {
                user_name: stream.user_name,
                url: `https://twitch.tv/${stream.user_login}`,
                title: stream.title,
                game: stream.game_name,
                game_image: `https://static-cdn.jtvnw.net/ttv-boxart/${encodeURI(stream.game_name)}-144x192.jpg`,
                preview: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user_login}-${Math.floor(Math.random() * 81) + 1200}x${
                    Math.floor(Math.random() * 21) + 700
                }.jpg`
            }
        }
    }

    logger.log(`[Twitch] User "${user_id}" now offline`)
}

export async function handleIncomingWebhook(messageId: string, data: ITwitchIncomingWebhook) {
    if (data.subscription.type === 'stream.online') {
        const subscription = await db.twitchSubs.findOne({ _id: data.subscription.id })

        if (!subscription) {
            logger.log(`[Twitch] Database entry for subscription "${data.subscription.id}" not found`)

            try {
                await eventSubUnsubscribe(data.subscription.id)
            } catch (err) {}

            return null
        }

        if (subscription.last_eventsub_message_id == messageId) return null
        else await db.twitchSubs.updateOne({ _id: data.subscription.id }, { $set: { last_eventsub_message_id: messageId } })

        logger.log(`[Twitch] Handling incoming webhook from subscription "${data.subscription.id}"`)

        const subscribedGuilds = await db.servers.find({ 'modules.subscriptions.twitch.broadcaster_id': data.event.broadcaster_user_id })

        if (!subscribedGuilds.length) {
            logger.log(`[Twitch] No subscribed guilds found for subscription "${data.subscription.id}"`)

            try {
                await eventSubUnsubscribe(data.subscription.id)
                await db.twitchSubs.deleteOne({ _id: data.subscription.id })
            } catch (err) {}

            return null
        }

        const stream = await getStream(data.event.broadcaster_user_id)

        if (!stream) return null

        logger.log(
            `[Twitch] Sending notifications about stream "${data.event.broadcaster_user_id}" to guilds ${subscribedGuilds.map(i => i._id).join(',')}`
        )

        for (const guild of subscribedGuilds) {
            const guildSubscription = guild.modules.subscriptions.twitch
                .slice(0, guild.server.premium.available ? 10 : 1)
                .find(i => i.broadcaster_id === data.event.broadcaster_user_id)

            if (!guildSubscription) continue

            let webhook: any

            try {
                webhook = await restApi.get(apiRoutes.webhook(guildSubscription.webhook_id, guildSubscription.webhook_token))
            } catch (err) {}

            if (!webhook) {
                try {
                    webhook = await restApi.post(apiRoutes.channelWebhooks(guildSubscription.notification_channel_id), {
                        body: {
                            name: data.event.broadcaster_user_name
                        }
                    })
                } catch (err) {}

                if (webhook)
                    await db.servers.updateOne(
                        { _id: guild._id, 'modules.subscriptions.twitch.broadcaster_id': data.event.broadcaster_user_id },
                        {
                            $set: {
                                'modules.subscriptions.twitch.$.webhook_id': webhook.id,
                                'modules.subscriptions.twitch.$.webhook_token': webhook.token
                            }
                        }
                    )
                else continue
            }

            let notificationText = guildSubscription.notification_message.content || null

            if (notificationText) {
                const replacer = new Replacer()
                notificationText = await replacer.replace(notificationText, {
                    subs: { name: stream.user_name, title: stream.title, link: stream.url }
                })
            }

            try {
                await restApi.post(apiRoutes.webhook(webhook.id, webhook.token), {
                    body: {
                        content: notificationText,
                        embeds: [
                            {
                                title: stream.title,
                                description: stream.game,
                                url: stream.url,
                                thumbnail: { url: stream.game_image },
                                image: {
                                    url: guildSubscription.display_stream_preview
                                        ? stream.preview
                                        : 'https://static-cdn.jtvnw.net/ttv-static/404_preview-1280x720.jpg'
                                }
                            }
                        ]
                    }
                })
            } catch (err) {}

            handleModuleExecutionData({
                module: 'Twitch',
                category: 'SendNotification',
                guild: { id: guild._id, name: 'Unknown' },
                target: { id: guildSubscription.broadcaster_id, name: guildSubscription.broadcaster_name }
            })
        }
    }
}

export interface TwitchSearchResponse {
    data: TwitchSearchResponseData[]
    pagination: { cursor: string }
}

export interface TwitchSearchResponseData {
    broadcaster_language: string
    broadcaster_login: string
    display_name: string
    game_id: string
    game_name: string
    id: string
    is_live: boolean
    tag_ids: any[]
    thumbnail_url: string
    title: string
    started_at: string
}

export interface TwitchStreamResponse {
    data: TwitchStreamResponseData[]
    pagination: { cursor: string }
}

export interface TwitchStreamResponseData {
    id: string
    user_id: string
    user_login: string
    user_name: string
    game_id: string
    game_name: string
    type: string
    title: string
    viewer_count: number
    started_at: string
    language: string
    thumbnail_url: string
    tag_ids: any[]
    is_mature: boolean
}

export interface ITwitchIncomingWebhook {
    subscription: {
        id: string
        status: string
        type: string
        version: string
        condition: { broadcaster_user_id: string }
        transport: {
            method: string
            callback: string
        }
        created_at: string
        cost: number
    }
    event: {
        id: string
        broadcaster_user_id: string
        broadcaster_user_login: string
        broadcaster_user_name: string
        type: string
        started_at: string
    }
}

export default {
    searchChannels,
    eventSubSubscribe,
    eventSubUnsubscribe,
    handleIncomingWebhook
}
