const { MessageEmbed } = require('discord.js')
const fetch = require('node-fetch')
const { scheduleJob, RecurrenceRule, Range } = require('node-schedule')
const Replacer = require('./Replacer')

class Twitch {
    /**
     * @param {string} query
     */
    static async searchChannels(query) {
        const options = {
            url: `https://api.twitch.tv/kraken/search/channels?query=${encodeURI(query)}`,
            method: 'GET',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                Accept: 'application/vnd.twitchtv.v5+json'
            }
        }

        const res = await fetch(options.url, options)

        if (res.status === 200) {
            const data = await res.json()

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

    /**
     * @param {import('../internals/Typings').TwitchChannel} channel
     */
    static async checkOnLive(channel) {
        const options = {
            url: `https://api.twitch.tv/kraken/streams/${channel.channel.id}`,
            method: 'GET',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                Accept: 'application/vnd.twitchtv.v5+json'
            }
        }

        const res = await fetch(options.url, options)

        if (res.status === 200) {
            const data = await res.json()

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

    /**
     * @param {import('../internals/Lacuna')} self
     */
    static async scheduleCheck(self) {
        const rule = new RecurrenceRule()
        rule.minute = new Range(0, 59, 1)

        const job = await scheduleJob(rule, async () => {
            let servers = await self.db.servers.findSome({ 'modules.twitch.channels.0': { $exists: true } })

            servers = servers.filter(server => self.guilds.cache.has(server._id))

            for (const server of servers) {
                const broadcasters = server.modules.twitch.channels.sort((a, b) => a.channel.display_name - b.channel.display_name).filter(c => (Date.now() - c.last_check_timestamp) > 180000)

                await self.logger.info(`(Twitch): Scheduled check started for ${broadcasters.length} channels`)
                
                await broadcasters.forEach(async (broadcaster, i) => {
                    if (i > 1 && !server.server.premium.available) return false

                    const guild = self.guilds.cache.get(server._id)

                    if (!guild || !guild.available) return false

                    const channel = guild.channels.cache.get(broadcaster.alerts.channel_id)

                    if (channel) {
                        const stream = await Twitch.checkOnLive(broadcaster)

                        if (stream && !broadcaster.live) {
                            await self.db.servers.update({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                                $set: {
                                    'modules.twitch.channels.$.live': true
                                }
                            })

                            if (stream.name != broadcaster.channel.display_name || stream.logo != broadcaster.channel.logo) {
                                await self.db.servers.update({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                                    $set: {
                                        'modules.twitch.channels.$.channel.display_name': stream.name,
                                        'modules.twitch.channels.$.channel.logo': stream.logo
                                    }
                                })
                            }

                            const webhooks = await guild.fetchWebhooks()
                            let webhook = webhooks.get(broadcaster.alerts.webhook.id)

                            if (!webhook) {
                                try {
                                    webhook = await channel.createWebhook(stream.name, { avatar: stream.logo })
                                } catch (err) {
                                    return false
                                }

                                await self.db.servers.update({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
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

                            const content = broadcaster.alerts.message_template ? await Replacer.Replace(self, broadcaster.alerts.message_template, { guild: guild, member: guild.me, subs: { name: stream.name, title: stream.status, link: stream.url } }) : null

                            const message = await webhook.send(content, {
                                embeds: [embed],
                                avatarURL: stream.logo,
                                name: stream.name
                            })

                            if (broadcaster.alerts.after_end.delete_alert && message.id) {
                                await self.db.servers.update({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                                    $set: {
                                        'modules.twitch.channels.$.alerts.after_end.message_id': message.id
                                    }
                                })
                            }

                            await self.emit('moduleExecution', { module: 'Twitch', guild: { id: guild.id, name: guild.name }, target: { id: broadcaster.channel.id, name: broadcaster.channel.display_name } })
                        }

                        else if (!stream && broadcaster.live) {
                            await self.db.servers.update({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                                $set: {
                                    'modules.twitch.channels.$.live': false,
                                    'modules.twitch.channels.$.alerts.after_end.message_id': ''
                                }
                            })

                            if (broadcaster.alerts.after_end.delete_alert && broadcaster.alerts.after_end.message_id) await channel.bulkDelete([broadcaster.alerts.after_end.message_id])
                        }

                        await self.db.servers.update({ _id: server._id, 'modules.twitch.channels.channel.id': broadcaster.channel.id }, {
                            $set: {
                                'modules.twitch.channels.$.last_check_timestamp': Date.now()
                            }
                        })
                    }
                })
            }
        })

        await self.logger.info(`(Twitch): Scheduled check has been initialized`)

        return job
    }
}

module.exports = Twitch