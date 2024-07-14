import { makeURLSearchParams } from 'discord.js'
import fetch from 'node-fetch'
import { scheduleJob } from 'node-schedule'
import database from '../../../database'
import { handleModuleExecutionData } from '../../../events/system/ModuleExecution'
import Logger from '../../../internals/Logger'
import { truncateString } from '../../../internals/utility/Utils'
import Replacer from '../../../modules/Replacer'
import DiscordUtils from '../../utility/DiscordUtils'

export async function searchChannels(term: string) {
    term = term.startsWith('UC') ? `channelId=${term}` : `q=${encodeURI(term)}`
    Logger.log(`[YouTube] Searching channels with term "${term}"`)

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&${term}&maxResults=15&type=channel&key=${process.env.LCN_GOOGLE_API_KEY}`,
        {
            method: 'GET'
        }
    )

    if (response.ok) {
        const data: YouTubeSearchResponse = await response.json()

        if (data.items?.length) {
            Logger.log(`[YouTube] Found ${data.items.length} channels for term "${term}"`)

            return data.items.map(item => ({ id: item.id.channelId, name: item.snippet.channelTitle, thumbnail: item.snippet.thumbnails.medium.url }))
        }

        Logger.log(`[YouTUbe] Term "${term}" gave not search results`)

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
            'hub.callback': `${process.env.LCN_API_URL}/subscriptions/youtube/hubbub-webhook`,
            'hub.topic': topicUrl,
            'hub.mode': mode,
            'hub.secret': process.env.LCN_YOUTUBE_HMAC_SECRET,
            'hub.lease_seconds': '604800',
            'hub.verify': 'async'
        }) as any
    })
}

export function createRefreshmentSchedule() {
    const job = scheduleJob('hub-refresh-subs', { hour: 0, minute: 0 }, async () => {
        const subs = (await database.youtubeSubs.find({})).filter(sub => sub.expiration_timestamp - Date.now() < 129_600_000)

        subs.forEach((sub, i) => {
            setTimeout(() => hubSubscribe(sub._id), i * 1500)
        })
    })

    return job
}

export async function handleHubBubWebhook(data: HubBubWebhookData) {
    const subscription = await database.youtubeSubs.findOne({ _id: data.channelId })

    if (!subscription) {
        Logger.log(`[YouTube] Database entry for subscription "${data.channelId}" not found`)

        try {
            await hubSubscribe(data.channelId, 'unsubscribe')
        } catch (err) {}

        return
    }

    if (subscription.last_video_id == data.videoId) return null
    else await database.youtubeSubs.updateOne({ _id: data.channelId }, { $set: { last_video_id: data.videoId } })

    Logger.info(`[YouTube] Handling incoming webhook from subscription "${data.channelId}"`)

    const subscribedGuilds = await database.servers.find({ 'modules.subscriptions.youtube.channel_id': data.channelId })

    if (!subscribedGuilds.length) {
        Logger.log(`[YouTube] No subscribed guilds found for subscription "${data.channelId}"`)

        try {
            await hubSubscribe(data.channelId, 'unsubscribe')
            await database.youtubeSubs.deleteOne({ _id: data.channelId })
        } catch (err) {}

        return
    }

    const videoUrl = `https://www.youtube.com/watch?v=${data.videoId}`

    Logger.log(`[YouTube] Sending notifications about video "${data.videoId}" to guilds ${subscribedGuilds.map(i => i._id).join(',')}`)

    for (const guild of subscribedGuilds) {
        const guildSubscription = guild.modules.subscriptions.youtube
            .slice(0, guild.premium.available ? 10 : 1)
            .find(i => i.channel_id == data.channelId)

        if (!guildSubscription) continue

        let webhook: any

        try {
            webhook = await DiscordUtils.rest.get(DiscordUtils.restRoutes.webhook(guildSubscription.webhook_id, guildSubscription.webhook_token))
        } catch (err) {
            await Logger.handleError({
                module: 'YouTube',
                action: 'GetWebhook',
                error: err,
                guild_id: guild._id
            })
        }

        if (!webhook) {
            try {
                webhook = await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelWebhooks(guildSubscription.notification_channel_id), {
                    body: {
                        name: data.channelName
                    }
                })
            } catch (err) {
                await Logger.handleError({
                    module: 'YouTube',
                    action: 'CreateWebhook',
                    error: err,
                    guild_id: guild._id
                })

                continue
            }

            await database.servers.updateOne(
                { _id: guild._id, 'modules.subscriptions.youtube.channel_id': data.channelId },
                {
                    $set: {
                        'modules.subscriptions.youtube.$.webhook_id': webhook.id,
                        'modules.subscriptions.youtube.$.webhook_token': webhook.token
                    }
                }
            )
        }

        let notificationText = guildSubscription.notification_message.content || null
        const hasVideoUrl = /{\s*(subs.link)\s*}/g.test(notificationText ?? '')

        if (notificationText) {
            const replacer = new Replacer(guild.premium.available)
            notificationText = await replacer.replace(notificationText, {
                subs: { name: data.channelName, title: data.videoTitle, link: videoUrl }
            })
        }

        try {
            const message: any = await DiscordUtils.rest.post(DiscordUtils.restRoutes.webhook(webhook.id, webhook.token), {
                body: {
                    content: hasVideoUrl ? notificationText : notificationText ? `${notificationText}\n${videoUrl}` : videoUrl
                },
                query: makeURLSearchParams({ wait: true }) as any
            })

            if (guildSubscription.options?.includes?.('CROSSPOST_MESSAGE')) {
                await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessageCrosspost(message.channel_id, message.id))
            }

            if (guildSubscription.options?.includes?.('CREATE_THREAD')) {
                await DiscordUtils.rest.post(DiscordUtils.restRoutes.threads(message.channel_id, message.id), {
                    body: {
                        name: truncateString(data.videoTitle, 100)
                    }
                })
            }
        } catch (err) {
            await Logger.handleError({
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

export default {
    searchChannels,
    hubSubscribe,
    createRefreshmentSchedule,
    handleHubBubWebhook
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

export interface HubBubWebhookData {
    videoId: string
    videoTitle: string
    channelId: string
    channelName: string
    publishedTimestamp: number
    updatedTimestamp: number
}
