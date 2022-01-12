import { BaseGuildTextChannel, MessageEmbed } from 'discord.js'
import fetch from 'node-fetch'
import { ServerDocument, TwitchChannel } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export async function searchChannels(query: string) {
    const res = await fetch(`https://api.twitch.tv/kraken/search/channels?query=${encodeURI(query)}`, {
        method: 'GET',
        headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            Accept: 'application/vnd.twitchtv.v5+json'
        }
    })

    if (res.status === 200) {
        const data: TwitchSearchResponse = await res.json()

        if (data.channels && data.channels.length) {
            return data.channels.map(channel => {
                return {
                    id: channel._id,
                    display_name: channel.display_name,
                    logo: channel.logo
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

    public async existsAndCorrect() {
        const server = await this.self.db.servers.findOne({ _id: this.guild_id })
        const channels = server.modules.twitch.channels

        return {
            exists: channels.some(c => c.channel.id == this.id),
            correct: channels.findIndex(c => c.channel.id == this.id) <= (server.server.premium.available ? 9 : 1)
        }
    }

    public async getStream() {
        const res = await fetch(`https://api.twitch.tv/kraken/streams/${this.id}`, {
            method: 'GET',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                Accept: 'application/vnd.twitchtv.v5+json'
            }
        })
    
        if (res.status === 200) {
            const data: TwitchStreamResponse = await res.json()
    
            if (data.stream) {
                return {
                    name: data.stream.channel.display_name,
                    logo: data.stream.channel.logo,
                    url: data.stream.channel.url,
                    status: data.stream.channel.status,
                    game: data.stream.game,
                    game_image: `https://static-cdn.jtvnw.net/ttv-boxart/${encodeURI(data.stream.game)}-144x192.jpg`,
                    preview: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${data.stream.channel.name}-${Math.floor(Math.random() * 81) + 1200}x${Math.floor(Math.random() * 21) + 700}.jpg`,
                    banner: data.stream.channel.video_banner
                }
            }
        }
    }

    public async check() {
        const { exists, correct } = await this.existsAndCorrect()

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

                if (stream.name != this.display_name || stream.logo != this.logo) {
                    this.display_name = stream.name
                    this.logo = stream.logo

                    await this.self.db.servers.updateOne({ _id: this.guild_id, 'modules.twitch.channels.channel.id': this.id }, {
                        $set: {
                            'modules.twitch.channels.$.channel.display_name': stream.name,
                            'modules.twitch.channels.$.channel.logo': stream.logo
                        }
                    })
                }

                let webhook = await this.self.fetchWebhook(this.alerts_webhook_id, this.alerts_webhook_token).catch(() => {})

                if (!webhook) {
                    try {
                        webhook = await textChannel.createWebhook(stream.name, { avatar: stream.logo })
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
                    .setImage(this.alerts_display_preview ? stream.preview : stream.banner)
                    .setColor(0x563194)

                let content = this.alerts_message_content

                if (content) {
                    const replacer = new Replacer(this.self, this.alerts_message_content, { guild: guild, member: guild.me, subs: { name: stream.name, title: stream.status, link: stream.url } })
                    content = await replacer.replace()
                }

                const message = await webhook.send({
                    content,
                    embeds: [embed],
                    avatarURL: stream.logo,
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
    _total: number
    channels?: TwitchSearchChannel[]
}

export interface TwitchSearchChannel {
    _id: number
    broadcaster_language: string
    created_at: string
    display_name: string
    followers: number,
    game: string
    language: string
    logo: string
    mature: boolean
    name: string
    partner: boolean,
    profile_banner: string
    profile_banner_background_color?: string
    status: string
    updated_at: string
    url: string
    video_banner: string
    views: number
}

export interface TwitchStreamResponse {
    stream: {
        _id: number
        average_fps: number
        channel: TwitchSearchChannel
        created_at: string
        delay: number
        game: string
        is_playlist: boolean
        preview: {
            large: string
            medium: string
            small: string
            template: string
        },
        video_height: number,
        viewers: number
    }
}

export default {
    searchChannels,
    Twitch,
    handleEntries,
    addNewEntries
}