import { makeURLSearchParams } from 'discord.js'
import fetch from 'node-fetch'
import { scheduleJob } from 'node-schedule'
import db from '../database'
import { handleModuleExecutionData } from '../events/system/ModuleExecution'
import logger from '../internals/Logger'
import { apiRoutes, restApi } from '../internals/utility/DiscordUtils'
import { truncateString } from '../internals/utility/Utils'
import Replacer from './Replacer'

export async function searchChannels(term: string) {
    term = term.startsWith('UC') ? `channelId=${term}` : `q=${encodeURI(term)}`
    logger.log(`[YouTube] Searching channels with term "${term}"`)

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&${term}&maxResults=15&type=channel&key=${process.env.GOOGLE_API_KEY}`,
        {
            method: 'GET'
        }
    )

    if (response.ok) {
        const data: YouTubeSearchResponse = await response.json()

        if (data.items?.length) {
            logger.log(`[YouTube] Found ${data.items.length} channels for term "${term}"`)

            return data.items.map(item => ({ id: item.id.channelId, name: item.snippet.channelTitle, thumbnail: item.snippet.thumbnails.medium.url }))
        }

        logger.log(`[YouTUbe] Term "${term}" gave not search results`)

        return []
    }

    return []
}

export function hubSubscribe(channelId: string, mode: string = 'subscribe') {
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`

    return fetch('https://pubsubhubbub.appspot.com/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'hub.callback': `${process.env.API_URL}/subscriptions/youtube/hubbub-webhook`,
            'hub.topic': topicUrl,
            'hub.mode': mode,
            'hub.secret': process.env.YOUTUBE_HMAC_SECRET,
            'hub.lease_seconds': '604800',
            'hub.verify': 'async'
        }) as any
    })
}

export function hubRefreshSubscriptions() {
    const job = scheduleJob('hub-refresh-subs', { hour: 0, minute: 0 }, async () => {
        const subs = (await db.youtubeSubs.find({})).filter(sub => sub.expiration_timestamp - Date.now() < 129_600_000)

        subs.forEach((sub, i) => {
            setTimeout(() => hubSubscribe(sub._id), i * 1500)
        })
    })

    return job
}

export async function handleHubBubWebhook(data: IHubBubWebhookData) {
    const subscription = await db.youtubeSubs.findOne({ _id: data.channelId })

    if (!subscription) {
        logger.log(`[YouTube] Database entry for subscription "${data.channelId}" not found`)

        try {
            await hubSubscribe(data.channelId, 'unsubscribe')
        } catch (err) {}

        return
    }

    if (subscription.last_video_id == data.videoId) return null
    else await db.youtubeSubs.updateOne({ _id: data.channelId }, { $set: { last_video_id: data.videoId } })

    logger.info(`[YouTube] Handling incoming webhook from subscription "${data.channelId}"`)

    const subscribedGuilds = await db.servers.find({ 'modules.subscriptions.youtube.channel_id': data.channelId })

    if (!subscribedGuilds.length) {
        logger.log(`[YouTube] No subscribed guilds found for subscription "${data.channelId}"`)

        try {
            await hubSubscribe(data.channelId, 'unsubscribe')
            await db.youtubeSubs.deleteOne({ _id: data.channelId })
        } catch (err) {}

        return
    }

    const videoUrl = `https://www.youtube.com/watch?v=${data.videoId}`

    logger.log(`[YouTube] Sending notifications about video "${data.videoId}" to guilds ${subscribedGuilds.map(i => i._id).join(',')}`)

    for (const guild of subscribedGuilds) {
        const guildSubscription = guild.modules.subscriptions.youtube
            .slice(0, guild.server.premium.available ? 10 : 1)
            .find(i => i.channel_id == data.channelId)

        if (!guildSubscription) continue

        let webhook: any

        try {
            webhook = await restApi.get(apiRoutes.webhook(guildSubscription.webhook_id, guildSubscription.webhook_token))
        } catch (err) {
            logger.handleError({
                module: 'YouTube',
                action: 'GetWebhook',
                error: err,
                guild_id: guild._id
            })
        }

        if (!webhook) {
            try {
                webhook = await restApi.post(apiRoutes.channelWebhooks(guildSubscription.notification_channel_id), {
                    body: {
                        name: data.channelName
                    }
                })
            } catch (err) {
                logger.handleError({
                    module: 'YouTube',
                    action: 'CreateWebhook',
                    error: err,
                    guild_id: guild._id
                })
            }

            if (webhook)
                await db.servers.updateOne(
                    { _id: guild._id, 'modules.subscriptions.youtube.channel_id': data.channelId },
                    {
                        $set: {
                            'modules.subscriptions.youtube.$.webhook_id': webhook.id,
                            'modules.subscriptions.youtube.$.webhook_token': webhook.token
                        }
                    }
                )
            else continue
        }

        let notificationText = guildSubscription.notification_message.content || null
        const hasVideoUrl = /{\s*(subs.link)\s*}/g.test(notificationText ?? '')

        if (notificationText) {
            const replacer = new Replacer()
            notificationText = await replacer.replace(notificationText, {
                subs: { name: data.channelName, title: data.videoTitle, link: videoUrl }
            })
        }

        try {
            const message: any = await restApi.post(apiRoutes.webhook(webhook.id, webhook.token), {
                body: {
                    content: hasVideoUrl ? notificationText : notificationText ? `${notificationText}\n${videoUrl}` : videoUrl
                },
                query: makeURLSearchParams({ wait: true }) as any
            })

            if (guildSubscription.options?.includes?.('CROSSPOST_MESSAGE')) {
                await restApi.post(apiRoutes.channelMessageCrosspost(message.channel_id, message.id))
            }

            if (guildSubscription.options?.includes?.('CREATE_THREAD')) {
                await restApi.post(apiRoutes.threads(message.channel_id, message.id), {
                    body: {
                        name: truncateString(data.videoTitle, 100)
                    }
                })
            }
        } catch (err) {
            logger.handleError({
                module: 'YouTube',
                action: 'SendNotificationMessage',
                error: err,
                guild_id: guild._id
            })
        }

        handleModuleExecutionData({
            module: 'YouTube',
            category: 'SendNotification',
            guild: { id: guild._id, name: 'Unknown' },
            target: { id: guildSubscription.channel_id, name: guildSubscription.channel_name }
        })
    }
}

export interface YouTubeSearchResponse {
    kind: string
    etag: string
    nextPageToken: string
    prevPageToken: string
    regionCode: string
    pageInfo: {
        totalResults: number
        resultsPerPage: number
    }
    items: YouTubeSearchResponseItem[]
}

export interface YouTubeSearchResponseItem {
    kind: string
    etag: string
    id: {
        kind: string
        videoId: string
        channelId: string
        playlistId: string
    }
    snippet: {
        publishedAt: string
        channelId: string
        title: string
        description: string
        thumbnails: {
            default: YouTubeChannelThumbnail
            medium: YouTubeChannelThumbnail
            high: YouTubeChannelThumbnail
            standard: YouTubeChannelThumbnail
            maxres: YouTubeChannelThumbnail
        }
        channelTitle: string
        liveBroadcastContent: string
    }
}

export interface YouTubeChannelThumbnail {
    url: string
    width: number
    height: number
}

export interface IHubBubWebhookData {
    videoId: string
    videoTitle: string
    channelId: string
    channelName: string
    publishedTimestamp: number
    updatedTimestamp: number
}

export default {
    searchChannels
}
