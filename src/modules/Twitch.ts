import { BaseGuildTextChannel, MessageEmbed } from 'discord.js'
import fetch from 'node-fetch'
import { scheduleJob, RecurrenceRule, Range, Job } from 'node-schedule'
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

export async function checkOnLive(channel: TwitchChannel) {
    const res = await fetch(`https://api.twitch.tv/kraken/streams/${channel.channel.id}`, {
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

export function scheduleCheck(self: Lacuna): Job {
    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 5)

    const job = scheduleJob(rule, async () => {
        const guilds: string[] = self.guilds.cache.map(g => g.id)
        const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'modules.twitch.channels.0': { $exists: true } })

        let broadcaster_count: number = 0

        for (const server of servers) {
            const broadcasters = server.modules.twitch.channels.sort((a, b) => (a.channel.display_name as any) - (b.channel.display_name as any)).filter(c => (Date.now() - c.last_check_timestamp) > 600000)
            
            broadcasters.forEach(async (broadcaster, i) => {
                setTimeout(async () => {
                    if (i > 1 && !server.server.premium.available) return false

                    const guild = self.guilds.cache.get(server._id)

                    if (!guild || !guild.available) return false

                    const channel = guild.channels.cache.get(broadcaster.alerts.channel_id) as BaseGuildTextChannel

                    if (channel) {
                        const stream = await checkOnLive(broadcaster)

                        if (stream && !broadcaster.live) {
                            await self.db.servers.updateOne({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                                $set: {
                                    'modules.twitch.channels.$.live': true
                                }
                            })

                            if (stream.name != broadcaster.channel.display_name || stream.logo != broadcaster.channel.logo) {
                                await self.db.servers.updateOne({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                                    $set: {
                                        'modules.twitch.channels.$.channel.display_name': stream.name,
                                        'modules.twitch.channels.$.channel.logo': stream.logo
                                    }
                                })
                            }

                            let webhook = await self.fetchWebhook(broadcaster.alerts.webhook.id, broadcaster.alerts.webhook.token).catch(() => {})

                            if (!webhook) {
                                try {
                                    webhook = await channel.createWebhook(stream.name, { avatar: stream.logo })
                                } catch (err) { return false }

                                await self.db.servers.updateOne({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
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
                                .setImage(broadcaster.alerts.display_preview ? stream.preview : stream.banner)
                                .setColor(0x563194)

                            let content = (broadcaster.alerts.message_template ?? broadcaster.alerts.message.content) || null

                            if (content) {
                                const replacer = new Replacer(self, (broadcaster.alerts.message_template ?? broadcaster.alerts.message.content), { guild: guild, member: guild.me, subs: { name: stream.name, title: stream.status, link: stream.url } })
                                content = await replacer.replace()
                            }

                            const message = await webhook.send({
                                content,
                                embeds: [embed],
                                avatarURL: stream.logo,
                                username: stream.name
                            })

                            if (broadcaster.alerts.after_end.delete_alert && message.id) {
                                await self.db.servers.updateOne({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                                    $set: {
                                        'modules.twitch.channels.$.alerts.after_end.message_id': message.id
                                    }
                                })
                            }

                            self.emit('moduleExecution', { module: 'Twitch', guild: { id: guild.id, name: guild.name }, target: { id: broadcaster.channel.id, name: broadcaster.channel.display_name } })
                        }

                        else if (!stream && broadcaster.live) {
                            await self.db.servers.updateOne({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                                $set: {
                                    'modules.twitch.channels.$.live': false,
                                    'modules.twitch.channels.$.alerts.after_end.message_id': ''
                                }
                            })

                            if (broadcaster.alerts.after_end.delete_alert && broadcaster.alerts.after_end.message_id) await channel.bulkDelete([broadcaster.alerts.after_end.message_id])
                        }

                        await self.db.servers.updateOne({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                            $set: {
                                'modules.twitch.channels.$.last_check_timestamp': Date.now()
                            }
                        })
                    }
                }, i * 2000)
            })

            broadcaster_count += broadcasters.length
        }

        self.logger.info(`(Twitch): Checked ${broadcaster_count} channels on ${servers.length} servers`)
    })

    self.logger.info(`(Twitch): Scheduled check has been initialized`)

    return job
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
    checkOnLive,
    scheduleCheck
}