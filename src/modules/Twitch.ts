import { BaseGuildTextChannel, MessageEmbed } from 'discord.js'
import fetch from 'node-fetch'
import { ServerDocument, TwitchChannel } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export async function searchChannels(query: string) {
    const res = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURI(query)}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
        }
    })

    if (res.status === 200) {
        const data: TwitchSearchResponse = await res.json()

        if (data.data && data.data.length) {
            return data.data.map(channel => {
                return {
                    id: channel.id,
                    display_name: channel.display_name,
                    logo: channel.thumbnail_url
                }
            })
        }

        return []
    }

    return []
}

export class Twitch {
    public self: Lacuna
    public guild_id: string
    public is_live: boolean
    public id: number
    public display_name: string
    public logo: string
    public alerts_channel_id: string
    public alerts_message_content: string
    public alerts_display_preview: boolean
    public delete_alert_after_end: boolean
    public alert_message_id: string
    public alerts_webhook_id: string
    public alerts_webhook_token: string
    private interval: NodeJS.Timer

    constructor(self: Lacuna, guild_id: string, channel: TwitchChannel) {
        this.self = self

        this.guild_id = guild_id

        this.is_live = channel.live

        this.id = channel.channel.id

        this.display_name = channel.channel.display_name

        this.logo = channel.channel.logo

        this.alerts_channel_id = channel.alerts.channel_id

        this.alerts_message_content = (channel.alerts.message_template ?? channel.alerts.message.content) || null

        this.alerts_display_preview = channel.alerts.display_preview

        this.delete_alert_after_end = channel.alerts.after_end.delete_alert

        this.alert_message_id = channel.alerts.after_end.message_id

        this.alerts_webhook_id = channel.alerts.webhook.id

        this.alerts_webhook_token = channel.alerts.webhook.token

        this.interval = null

        this.initialize()
    }

    private initialize() {
        this.interval = setInterval(() => this.check(), 300000)
        this.self.twitchChannels.set(`${this.id}:${this.guild_id}`, this)
    }

    public async fetch() {
        const server = await this.self.db.servers.findOne({ _id: this.guild_id })
        const channels = server.modules.twitch.channels

        const exists = channels.some(c => c.channel.id == this.id)

        if (exists) {
            const channel = channels.find(c => c.channel.id == this.id)

            if (channel.alerts.channel_id != this.alerts_channel_id) this.alerts_channel_id = channel.alerts.channel_id
            if (channel.alerts.message.content != this.alerts_message_content) this.alerts_message_content = channel.alerts.message.content
        }

        return {
            exists,
            correct: channels.findIndex(c => c.channel.id == this.id) <= (server.server.premium.available ? 9 : 1)
        }
    }

    public async getStream() {
        const res = await fetch(`https://api.twitch.tv/helix/streams?user_id=${this.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID
            }
        })
    
        if (res.status === 200) {
            const data: TwitchStreamResponse = await res.json()
            const stream = data.data[0]
    
            if (stream) {
                return {
                    name: stream.user_name,
                    url: `https://twitch.tv/${stream.user_login}`,
                    status: stream.title,
                    game: stream.game_name,
                    game_image: `https://static-cdn.jtvnw.net/ttv-boxart/${encodeURI(stream.game_name)}-144x192.jpg`,
                    preview: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user_login}-${Math.floor(Math.random() * 81) + 1200}x${Math.floor(Math.random() * 21) + 700}.jpg`
                }
            }
        }
    }

    public async check() {
        const { exists, correct } = await this.fetch()

        if (!exists) { this.delete(); return false }
        if (!correct) return false

        const guild = this.self.guilds.cache.get(this.guild_id)

        if (!guild || !guild.available) return false

        const textChannel = this.self.channels.cache.get(this.alerts_channel_id) as BaseGuildTextChannel

        if (textChannel) {
            const stream = await this.getStream()

            if (stream && !this.is_live) {
                this.is_live = true

                await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.twitch.channels.channel.id': this.id }, {
                    $set: {
                        'modules.twitch.channels.$.live': true
                    }
                })

                if (stream.name != this.display_name) {
                    this.display_name = stream.name

                    await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.twitch.channels.channel.id': this.id }, {
                        $set: {
                            'modules.twitch.channels.$.channel.display_name': stream.name
                        }
                    })
                }

                let webhook = await this.self.fetchWebhook(this.alerts_webhook_id, this.alerts_webhook_token).catch(() => {})

                if (!webhook) {
                    try {
                        webhook = await textChannel.createWebhook(stream.name)
                    } catch (err) { return false }

                    this.alerts_webhook_id = webhook.id
                    this.alerts_webhook_token = webhook.token

                    await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.twitch.channels.channel.id': this.id }, {
                        $set: {
                            'modules.twitch.channels.$.alerts.webhook.id': webhook.id,
                            'modules.twitch.channels.$.alerts.webhook.token': webhook.token
                        }
                    })
                }

                const embed = new MessageEmbed()
                    .setTitle(stream.status)
                    .setDescription(stream.game)
                    .setURL(stream.url)
                    .setThumbnail(stream.game_image)
                    .setImage(this.alerts_display_preview ? stream.preview : 'https://static-cdn.jtvnw.net/ttv-static/404_preview-1280x720.jpg')
                    .setColor(0x563194)

                let content = this.alerts_message_content

                console.log(typeof content, this.alerts_message_content.length)

                if (content) {
                    const replacer = new Replacer(this.self, content, { guild: guild, member: guild.me, subs: { name: stream.name, title: stream.status, link: stream.url } })
                    content = await replacer.replace()
                }

                const message = await webhook.send({
                    content,
                    embeds: [embed],
                    username: stream.name
                })

                if (this.delete_alert_after_end && message.id) {
                    this.alert_message_id = message.id

                    await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.twitch.channels.channel.id': this.id }, {
                        $set: {
                            'modules.twitch.channels.$.alerts.after_end.message_id': message.id
                        }
                    })
                }

                this.self.emit('moduleExecution', { module: 'Twitch', guild: { id: guild.id, name: guild.name }, target: { id: this.id, name: this.display_name } })
            }

            else if (!stream && this.is_live) {
                this.is_live = false

                await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.twitch.channels.channel.id': this.id }, {
                    $set: {
                        'modules.twitch.channels.$.live': false,
                        'modules.twitch.channels.$.alerts.after_end.message_id': ''
                    }
                })

                if (this.delete_alert_after_end && this.alert_message_id) {
                    this.alert_message_id = ''
                    await textChannel.bulkDelete([this.alert_message_id])
                }
            }

            await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.twitch.channels.channel.id': this.id }, {
                $set: {
                    'modules.twitch.channels.$.last_check_timestamp': Date.now()
                }
            })
        }
    }

    public delete() {
        clearInterval(this.interval)
        this.self.twitchChannels.delete(`${this.id}:${this.guild_id}`)
        this.self.logger.log(`(Twitch): "${this.display_name}" (${this.id}) has been deleted`)
    }
}

export async function handleEntries(self: Lacuna) {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'modules.twitch.channels.0': { $exists: true } })

    let entries = 0

    for (const server of servers) {
        const channels = server.modules.twitch.channels

        for (const channel of channels) {
            const i = channels.indexOf(channel)
            setTimeout(() => new Twitch(self, server._id, channel), i * (Math.round(Math.random() * 5000) + 2000))
        }

        entries += channels.length
    }

    setInterval(() => addNewEntries(self), 150000)

    self.logger.log(`(Twitch): Loaded ${entries} twitch channels from ${servers.length} servers`)
}

export async function addNewEntries(self: Lacuna) {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'modules.twitch.channels.0': { $exists: true } })

    let entries = 0

    for (const server of servers) {
        const channels = server.modules.twitch.channels

        for (const channel of channels) {
            const entry = self.twitchChannels.get(`${channel.channel.id}:${server._id}`)

            if (!entry) { new Twitch(self, server._id, channel); entries++ }
        }
    }

    if (entries) self.logger.log(`(Twitch): Added ${entries} new twitch channels from ${servers.length} servers`)
}

export interface TwitchSearchResponse {
    data: TwitchSearchChannel[]
    pagination: { cursor: string }
}

export interface TwitchSearchChannel {
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
    data: Array<{
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
    }>
    pagination: { cursor: string }
}

export default {
    searchChannels,
    Twitch,
    handleEntries,
    addNewEntries
}