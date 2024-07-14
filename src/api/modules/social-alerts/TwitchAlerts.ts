import { makeURLSearchParams } from 'discord.js'
import fetch from 'node-fetch'
import database from '../../../database'
import { handleModuleExecutionData } from '../../../events/system/ModuleExecution'
import Logger from '../../../internals/Logger'
import { truncateString } from '../../../internals/utility/Utils'
import Replacer from '../../../modules/Replacer'
import DiscordUtils from '../../utility/DiscordUtils'

async function getAppAccessToken() {
    let token: any = await database.qdb.get('twitchAccessToken')

    if (!token || Date.now() > token.expires_at) {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.LCN_TWITCH_CLIENT_ID,
                client_secret: process.env.LCN_TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            })
        })

        if (response.ok) {
            const data = await response.json()

            await database.qdb.set('twitchAccessToken', data.access_token, data.expires_in)

            token = data.access_token
        }
    }

    return token ?? null
}

export async function searchChannels(query: string) {
    Logger.log(`[Twitch] Searching channels with query "${query}"`)

    const twitchToken = await getAppAccessToken()
    const response = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURI(query)}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${twitchToken}`,
            'Client-Id': process.env.LCN_TWITCH_CLIENT_ID
        }
    })

    if (response.ok) {
        const { data } = (await response.json()) as TwitchSearchResponse

        if (data?.length) {
            Logger.log(`[Twitch] Found ${data.length} channels for query "${query}"`)

            return data.map(i => ({
                id: i.id,
                name: i.display_name,
                login: i.broadcaster_login,
                thumbnail: i.thumbnail_url
            }))
        }

        Logger.log(`[Twitch] Query "${query}" gave not search results`)

        return []
    }

    return []
}

export async function eventSubSubscribe(type: string, user_id: string) {
    const twitchToken = await getAppAccessToken()

    return await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${twitchToken}`,
            'Client-Id': process.env.LCN_TWITCH_CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type,
            version: '1',
            condition: { broadcaster_user_id: user_id },
            transport: {
                method: 'webhook',
                callback: `${process.env.LCN_API_URL}/subscriptions/twitch/eventsub-webhook`,
                secret: process.env.LCN_TWITCH_SIGNING_SECRET
            }
        })
    })
}

export async function eventSubUnsubscribe(subscription_id: string) {
    const twitchToken = await getAppAccessToken()

    return await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscription_id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${twitchToken}`,
            'Client-Id': process.env.LCN_TWITCH_CLIENT_ID
        }
    })
}

export async function getEventSubsByUserId(userId: string) {
    const twitchToken = await getAppAccessToken()

    return await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?user_id=${userId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${twitchToken}`,
            'Client-Id': process.env.LCN_TWITCH_CLIENT_ID
        }
    })
}

export async function getStream(user_id: string) {
    Logger.log(`[Twitch] Getting stream of user "${user_id}"`)

    const twitchToken = await getAppAccessToken()
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user_id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${twitchToken}`,
            'Client-Id': process.env.LCN_TWITCH_CLIENT_ID
        }
    })

    if (res.status === 200) {
        const { data } = (await res.json()) as TwitchStreamResponse
        const stream = data[0]

        if (stream) {
            Logger.log(`[Twitch] Stream of user "${user_id}" found`)

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

    Logger.log(`[Twitch] User "${user_id}" now offline`)
}

export async function handleIncomingWebhook(messageId: string, data: TwitchIncomingWebhook) {
    if (data.subscription.type === 'stream.online') {
        const subscription = await database.twitchSubs.findOne({ _id: data.subscription.id })

        if (!subscription) {
            Logger.log(`[Twitch] Database entry for subscription "${data.subscription.id}" not found`)

            try {
                await eventSubUnsubscribe(data.subscription.id)
            } catch (err) {}

            return null
        }

        if (subscription.last_eventsub_message_id == messageId) return null
        else await database.twitchSubs.updateOne({ _id: data.subscription.id }, { $set: { last_eventsub_message_id: messageId } })

        Logger.log(`[Twitch] Handling incoming webhook from subscription "${data.subscription.id}"`)

        const subscribedGuilds = await database.servers.find({
            'modules.subscriptions.twitch.broadcaster_id': data.event.broadcaster_user_id
        })

        if (!subscribedGuilds.length) {
            Logger.log(`[Twitch] No subscribed guilds found for subscription "${data.subscription.id}"`)

            try {
                await eventSubUnsubscribe(data.subscription.id)
                await database.twitchSubs.deleteOne({ _id: data.subscription.id })
            } catch (err) {}

            return null
        }

        const stream = await getStream(data.event.broadcaster_user_id)

        if (!stream) return null

        Logger.log(
            `[Twitch] Sending notifications about stream "${data.event.broadcaster_user_id}" to guilds ${subscribedGuilds.map(i => i._id).join(',')}`
        )

        for (const guild of subscribedGuilds) {
            const guildSubscription = guild.modules.subscriptions.twitch
                .slice(0, guild.premium.available ? 10 : 1)
                .find(i => i.broadcaster_id === data.event.broadcaster_user_id)

            if (!guildSubscription) continue

            let webhook: any

            try {
                webhook = await DiscordUtils.rest.get(DiscordUtils.restRoutes.webhook(guildSubscription.webhook_id, guildSubscription.webhook_token))
            } catch (err) {
                await Logger.handleError({
                    module: 'Twitch',
                    action: 'GetWebhook',
                    error: err,
                    guild_id: guild._id
                })
            }

            if (!webhook) {
                try {
                    webhook = await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelWebhooks(guildSubscription.notification_channel_id), {
                        body: {
                            name: data.event.broadcaster_user_name
                        }
                    })
                } catch (err) {
                    await Logger.handleError({
                        module: 'Twitch',
                        action: 'CreateWebhook',
                        error: err,
                        guild_id: guild._id
                    })

                    continue
                }

                await database.servers.updateOne(
                    {
                        _id: guild._id,
                        'modules.subscriptions.twitch.broadcaster_id': data.event.broadcaster_user_id
                    },
                    {
                        $set: {
                            'modules.subscriptions.twitch.$.webhook_id': webhook.id,
                            'modules.subscriptions.twitch.$.webhook_token': webhook.token
                        }
                    }
                )
            }

            let notificationText = guildSubscription.notification_message.content || null

            if (notificationText) {
                const replacer = new Replacer(guild.premium.available)
                notificationText = await replacer.replace(notificationText, {
                    subs: { name: stream.user_name, title: stream.title, link: stream.url }
                })
            }

            try {
                const message: any = await DiscordUtils.rest.post(DiscordUtils.restRoutes.webhook(webhook.id, webhook.token), {
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
                    },
                    query: makeURLSearchParams({ wait: true }) as any
                })

                if (guildSubscription.options?.includes?.('CROSSPOST_MESSAGE')) {
                    await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessageCrosspost(message.channel_id, message.id))
                }

                if (guildSubscription.options?.includes?.('CREATE_THREAD')) {
                    await DiscordUtils.rest.post(DiscordUtils.restRoutes.threads(message.channel_id, message.id), {
                        body: {
                            name: truncateString(stream.title, 100)
                        }
                    })
                }
            } catch (err) {
                await Logger.handleError({
                    module: 'Twitch',
                    action: 'SendNotificationMessage',
                    error: err,
                    guild_id: guild._id
                })
            }

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

export interface TwitchIncomingWebhook {
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
