import fetch from 'node-fetch'
import { scheduleJob } from 'node-schedule'
import db from '../database'
import logger from '../internals/Logger'
import { apiRoutes, restApi } from '../internals/utility/DiscordUtils'
import Replacer from './Replacer'

export async function searchChannels(term: string) {
    term = term.startsWith('UC') ? `channelId=${term}` : `q=${encodeURI(term)}`

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&${term}&maxResults=15&type=channel&key=${process.env.GOOGLE_API_KEY}`, {
        method: 'GET'
    })

    if (response.ok) {
        const data: YouTubeSearchResponse = await response.json()

        return data.items?.length
            ? data.items.map(item => ({ id: item.id.channelId, name: item.snippet.channelTitle, thumbnail: item.snippet.thumbnails.medium.url }))
            : []
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

    if (!subscription) return null

    if (subscription.last_video_id == data.videoId) return null
    else await db.youtubeSubs.updateOne({ _id: data.channelId }, { $set: { last_video_id: data.videoId } })

    logger.info(`(YouTube HubBub): Handling incoming webhook from subscription "${data.channelId}"`)

    const subscribedGuilds = await db.servers.find({ 'modules.subscriptions.youtube.channel_id': data.channelId })

    if (!subscribedGuilds.length) {
        await hubSubscribe(data.channelId, 'unsubscribe').catch(() => {})
        await db.youtubeSubs.deleteOne({ _id: data.channelId })

        return
    }

    const videoUrl = `https://www.youtube.com/watch?v=${data.videoId}`

    for (const guild of subscribedGuilds) {
        const guildSubscription = guild.modules.subscriptions.youtube.slice(0, guild.server.premium.available ? 10 : 1).find(i => i.channel_id == data.channelId)

        if (!guildSubscription) continue

        let webhook = (await restApi.get(apiRoutes.webhook(guildSubscription.webhook_id, guildSubscription.webhook_token)).catch(() => {})) as any

        if (!webhook) {
            webhook = await restApi
                .post(apiRoutes.channelWebhooks(guildSubscription.notification_channel_id), {
                    body: {
                        name: data.channelName
                    }
                })
                .catch(() => {})

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

        await restApi
            .post(apiRoutes.webhook(webhook.id, webhook.token), {
                body: {
                    content: hasVideoUrl ? notificationText : notificationText ? `${notificationText}\n${videoUrl}` : videoUrl
                }
            })
            .catch(() => {})
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
