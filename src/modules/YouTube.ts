import fetch from 'node-fetch'
import ParserRSS from 'rss-parser'
import moment from 'moment'
import Replacer from './Replacer'
import Lacuna from '../internals/Lacuna'
import { ServerDocument, YouTubeChannel } from '../database/schemas/Servers'
import { BaseGuildTextChannel } from 'discord.js'

const rss = new ParserRSS()

export async function searchChannels(term: string) {
    term = term.startsWith('UC') ? `channelId=${term}` : `q=${encodeURI(term)}`

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&${term}&maxResults=15&type=channel&key=${process.env.GOOGLE_API_KEY}`, { method: 'GET' })

    if (res.status === 200) {
        const data: YouTubeSearchResponse = await res.json()

        if (data.items && data.items.length) {
            return data.items.map(item => {
                return {
                    id: item.id.channelId,
                    name: item.snippet.channelTitle,
                    thumbnail: item.snippet.thumbnails.medium.url
                }
            })
        }

        return []
    }

    return []
}

export class YouTube {
    public self: Lacuna
    public guild_id: string
    public last_video_id: string
    public id: string
    public name: string
    public thumbnail: string
    public alerts_channel_id: string
    public alerts_videos_message_content: string
    public alerts_broadcasts_message_content: string
    public alerts_about_videos: boolean
    public alerts_about_broadcasts: boolean
    public alerts_webhook_id: string
    public alerts_webhook_token: string
    private interval: NodeJS.Timer

    constructor(self: Lacuna, guild_id: string, channel: YouTubeChannel) {
        this.self = self

        this.guild_id = guild_id

        this.last_video_id = channel.last_video_id

        this.id = channel.channel.id

        this.name = channel.channel.name

        this.thumbnail = channel.channel.thumbnail

        this.alerts_channel_id = channel.alerts.channel_id

        this.alerts_videos_message_content = (channel.alerts.videos_message_template ?? channel.alerts.videos_message.content) || null

        this.alerts_broadcasts_message_content = (channel.alerts.broadcasts_message_template ?? channel.alerts.broadcasts_message.content) || null

        this.alerts_about_videos = Boolean(channel.alerts.videos)

        this.alerts_about_broadcasts = Boolean(channel.alerts.broadcasts)

        this.alerts_webhook_id = channel.alerts.webhook.id

        this.alerts_webhook_token = channel.alerts.webhook.token

        this.interval = null

        this.initialize()
    }

    private initialize() {
        this.interval = setInterval(() => this.check(), 300000)
        this.self.youtubeChannels.set(`${this.id}:${this.guild_id}`, this)
    }

    public async fetch() {
        const server = await this.self.db.servers.findOne({ _id: this.guild_id })
        const channels = server.modules.youtube.channels

        const exists = channels.some(c => c.channel.id == this.id)

        if (exists) {
            const channel = channels.find(c => c.channel.id == this.id)

            if (channel.alerts.channel_id != this.alerts_channel_id) this.alerts_channel_id = channel.alerts.channel_id
            if (channel.alerts.videos != this.alerts_about_videos) this.alerts_about_videos = Boolean(channel.alerts.videos)
            if (channel.alerts.broadcasts != this.alerts_about_broadcasts) this.alerts_about_broadcasts = Boolean(channel.alerts.broadcasts)
            if (channel.alerts.videos_message.content != this.alerts_videos_message_content) this.alerts_videos_message_content = channel.alerts.videos_message.content
            if (channel.alerts.broadcasts_message.content != this.alerts_broadcasts_message_content) this.alerts_broadcasts_message_content = channel.alerts.broadcasts_message.content
        }

        return {
            exists,
            correct: channels.findIndex(c => c.channel.id == this.id) <= (server.server.premium.available ? 9 : 1)
        }
    }

    public async getLastVideo() {
        let feed

        try {
            feed = await rss.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${this.id}`)
        } catch (err) {
            feed = null
        }
    
        const video = feed && feed.items[0] ? feed.items[0] : null
    
        if (video) {
            const today = moment(), published = video.pubDate, video_id = video.id.replace('yt:video:', '')
    
            return {
                author: video.author,
                title: video.title,
                video_id: video_id,
                published: today.diff(published, 'hours'),
                url: video.link
            }
        }
    }

    public async isBroadcast(video_id: string) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${video_id}&key=${process.env.GOOGLE_API_KEY}`, { method: 'GET' })

        if (res.status === 200) {
            const data = await res.json()
            const video = data.items && data.items.length ? data.items[0] : null
    
            if (video && video.snippet.liveBroadcastContent == 'live') return true
    
            return false
        }
    
        return false
    }

    public async check() {
        const { exists, correct } = await this.fetch()

        if (!exists) { this.delete(); return false }
        if (!correct) return false

        const guild = this.self.guilds.cache.get(this.guild_id)

        if (!guild || !guild.available) return false

        const textChannel = guild.channels.cache.get(this.alerts_channel_id) as BaseGuildTextChannel

        if (textChannel) {
            const video = await this.getLastVideo()

            if (video && video.video_id != this.last_video_id && video.published <= 2) {
                this.last_video_id = video.video_id

                await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.youtube.channels.channel.id': this.id }, {
                    $set: {
                        'modules.youtube.channels.$.last_video_id': video.video_id
                    }
                })

                const is_broadcast = await this.isBroadcast(video.video_id)
                let webhook = await this.self.fetchWebhook(this.alerts_webhook_id, this.alerts_webhook_token).catch(() => {})

                if (!webhook) {
                    try {
                        webhook = await textChannel.createWebhook(this.name, { avatar: this.thumbnail })
                    } catch (err) { return false }

                    this.alerts_webhook_id = webhook.id
                    this.alerts_webhook_token = webhook.token

                    await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.youtube.channels.channel.id': this.id }, {
                        $set: {
                            'modules.youtube.channels.$.alerts.webhook.id': webhook.id,
                            'modules.youtube.channels.$.alerts.webhook.token': webhook.token
                        }
                    })
                }

                if (is_broadcast && this.alerts_about_broadcasts) {
                    const has_link = /{\s*(subs.link)\s*}/g.test(this.alerts_broadcasts_message_content ?? '')
                    const replacer = new Replacer(this.self, `${has_link ? this.alerts_broadcasts_message_content : `${this.alerts_broadcasts_message_content}\n${video.url}`}`, { guild: guild, member: guild.me, subs: { name: video.author, title: video.title, link: video.url } })
                    const content = await replacer.replace()

                    await webhook.send({ content })

                    this.self.emit('moduleExecution', { module: 'YouTube Broadcasts', guild: { id: guild.id, name: guild.name }, target: { id: this.id, name: this.name } })
                }

                else if (this.alerts_about_videos) {
                    const has_link = /{\s*(subs.link)\s*}/g.test(this.alerts_videos_message_content ?? '')
                    const replacer = new Replacer(this.self, `${has_link ? this.alerts_videos_message_content : `${this.alerts_videos_message_content}\n${video.url}`}`, { guild: guild, member: guild.me, subs: { name: video.author, title: video.title, link: video.url } })
                    const content = await replacer.replace()
                    
                    await webhook.send({ content })

                    this.self.emit('moduleExecution', { module: 'YouTube Videos', guild: { id: guild.id, name: guild.name }, target: { id: this.id, name: this.name } })
                }
            }

            await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.youtube.channels.channel.id': this.id }, {
                $set: {
                    'modules.youtube.channels.$.last_check_timestamp': Date.now()
                }
            })
        }
    }

    public delete() {
        clearInterval(this.interval)
        this.self.youtubeChannels.delete(`${this.id}:${this.guild_id}`)
        this.self.logger.log(`(YouTube): "${this.name}" (${this.id}) has been deleted`)
    }
}

export async function handleEntries(self: Lacuna) {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'modules.youtube.channels.0': { $exists: true } })

    let entries = 0

    for (const server of servers) {
        const channels = server.modules.youtube.channels

        for (const channel of channels) {
            const i = channels.indexOf(channel)
            setTimeout(() => new YouTube(self, server._id, channel), i * (Math.round(Math.random() * 5000) + 2000))
        }

        entries += channels.length
    }

    setInterval(() => addNewEntries(self), 150000)

    self.logger.log(`(YouTube): Loaded ${entries} youtube channels from ${servers.length} servers`)
}

export async function addNewEntries(self: Lacuna) {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'modules.youtube.channels.0': { $exists: true } })

    let entries = 0

    for (const server of servers) {
        const channels = server.modules.youtube.channels

        for (const channel of channels) {
            const entry = self.youtubeChannels.get(`${channel.channel.id}:${server._id}`)

            if (!entry) { new YouTube(self, server._id, channel); entries++ }
        }
    }

    if (entries) self.logger.log(`(YouTube): Added ${entries} new youtube channels from ${servers.length} servers`)
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
    items: YouTubeSearchChannel[]
}

export interface YouTubeSearchChannel {
    kind: string
    etag: string
    id: {
        kind: string
        videoId: string
        channelId: string
        playlistId: string
    },
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
        },
        channelTitle: string
        liveBroadcastContent: string
    }
}

export interface YouTubeChannelThumbnail {
    url: string
    width: number
    height: number
}

export default {
    searchChannels,
    YouTube,
    handleEntries,
    addNewEntries
}