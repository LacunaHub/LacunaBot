const fetch = require('node-fetch')
const RSS = require('rss-parser')
const moment = require('moment')
const { scheduleJob, RecurrenceRule, Range } = require('node-schedule')
const Replacer = require('./Replacer')

const rss = new RSS()

class YouTube {
    static async searchChannels(search_term) {
        search_term = search_term.startsWith('UC') ? `channelId=${search_term}` : `q=${encodeURI(search_term)}`

        const options = {
            url: `https://www.googleapis.com/youtube/v3/search?part=snippet&${search_term}&maxResults=15&type=channel&key=${process.env.GOOGLE_API_KEY}`,
            method: 'GET'
        }

        const res = await fetch(options.url, options)

        if (res.status === 200) {
            const data = await res.json()

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

    /**
     * @param {string} channel
     */
    static async checkVideos(channel_id) {
        let feed

        try {
            feed = await rss.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel_id}`)
        } catch (err) {
            feed = null
        }

        const video = feed && feed.items[0] ? feed.items[0] : null

        if (video) {
            const today = moment(), published = video.pubDate

            return {
                author: video.author,
                title: video.title,
                video_id: video.id.replace('yt:video:', ''),
                published: today.diff(published, 'hours'),
                url: video.link
            }
        }
    }

    /**
     * @param {string} video_id
     * @returns {Promise<boolean>}
     */
    static async isLiveBroadcast(video_id) {
        const options = {
            url: `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${video_id}&key=${process.env.GOOGLE_API_KEY}`,
            method: 'GET'
        }

        const res = await fetch(options.url, options)

        if (res.status === 200) {
            const data = await res.json()
            const video = data.items && data.items.length ? data.items[0] : null

            if (video && video.snippet.liveBroadcastContent == 'live') return true

            return false
        }

        return false
    }

    /**
     * @param {import('../internals/Lacuna')} self
     */
    static async scheduleCheck(self) {
        const rule = new RecurrenceRule()
        rule.minute = new Range(0, 59, 1)

        const job = scheduleJob(rule, async () => {
            let servers = await self.db.servers.findSome({ 'modules.youtube.channels.0': { $exists: true } })

            servers = servers.filter(server => self.guilds.cache.has(server._id))

            await self.logger.info(`(YouTube): Scheduled check started for ${servers.length} servers`)

            for (const server of servers) {
                const channels = server.modules.youtube.channels.sort((a, b) => a.channel.name - b.channel.name).filter(c => (Date.now() - c.last_check_timestamp) > 180000 && (c.alerts.videos || c.alerts.broadcasts))
                
                await channels.forEach(async (channel, i) => {
                    if (i > 1 && !server.server.premium.available) return false

                    const guild = self.guilds.cache.get(server._id)

                    if (!guild || !guild.available) return false

                    const alert_channel = guild.channels.cache.get(channel.alerts.channel_id)

                    if (alert_channel) {
                        const video = await YouTube.checkVideos(channel.channel.id)

                        if (video && video.video_id != channel.last_video_id && video.published <= 2) {
                            await self.db.servers.update({ _id: server._id, 'modules.youtube.channels.channel.id': channel.channel.id }, {
                                $set: {
                                    'modules.youtube.channels.$.last_video_id': video.video_id
                                }
                            })

                            const is_broadcast = await YouTube.isLiveBroadcast(video.video_id)

                            const webhooks = await guild.fetchWebhooks()
                            let webhook = webhooks.get(channel.alerts.webhook.id)

                            if (!webhook) {
                                try {
                                    webhook = await alert_channel.createWebhook(channel.channel.name, { avatar: channel.channel.thumbnail })
                                } catch (err) {
                                    return false
                                }

                                await self.db.servers.update({ _id: server._id, 'modules.youtube.channels.channel.id': channel.channel.id }, {
                                    $set: {
                                        'modules.youtube.channels.$.alerts.webhook.id': webhook.id,
                                        'modules.youtube.channels.$.alerts.webhook.token': webhook.token
                                    }
                                })
                            }

                            if (is_broadcast && channel.alerts.broadcasts) {
                                const has_link = /{\s*(subs.link)\s*}/g.test(channel.alerts.broadcasts_message_template)
                                const content = await Replacer.Replace(self, `${has_link ? channel.alerts.broadcasts_message_template : `${channel.alerts.broadcasts_message_template}\n${video.url}`}`, { guild: guild, member: guild.me, subs: { name: video.author, title: video.title, link: video.url } })

                                await webhook.send(content)
    
                                await self.emit('moduleExecution', { module: 'YouTube: Broadcasts', guild: { id: guild.id, name: guild.name }, target: { id: channel.channel.id, name: channel.channel.name } })
                            }

                            else if (channel.alerts.videos) {
                                const has_link = /{\s*(subs.link)\s*}/g.test(channel.alerts.videos_message_template)
                                const content = await Replacer.Replace(self, `${has_link ? channel.alerts.videos_message_template : `${channel.alerts.videos_message_template}\n${video.url}`}`, { guild: guild, member: guild.me, subs: { name: video.author, title: video.title, link: video.url } })
                                
                                await webhook.send(content)
    
                                await self.emit('moduleExecution', { module: 'YouTube: Videos', guild: { id: guild.id, name: guild.name }, target: { id: channel.channel.id, name: channel.channel.display_name } })
                            }
                        }

                        await self.db.servers.update({ _id: server._id, 'modules.youtube.channels.channel.id': channel.channel.id }, {
                            $set: {
                                'modules.youtube.channels.$.last_check_timestamp': Date.now()
                            }
                        })
                    }
                })
            }
        })

        await self.logger.info(`(YouTube): Scheduled check has been initialized`)

        return job
    }
}

module.exports = YouTube