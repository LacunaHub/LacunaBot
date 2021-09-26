const Replacer = require('./Replacer')
const Canvas = require('canvas')
const { MessageAttachment } = require('discord.js')
const numbro = require('numbro')
const { scheduleJob, RecurrenceRule, Range } = require('node-schedule')

class Levels {
    /**
     * @param {string} user_id
     */
    static throttled(levels) {
        return (Date.now() - new Date(levels.activity.text.last_message_at)) < 60000
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async messageCreate(self, server, message) {
        if (!server.modules.levels.active) return false

        if (server.modules.levels.blocked.channels.includes(message.channel.id) || message.member.roles.cache.some(r => server.modules.levels.blocked.roles.includes(r.id))) return false
        if (server.modules.levels.allowed.channels.length && !server.modules.levels.allowed.channels.includes(message.channel.id)) return false
        if (server.modules.levels.allowed.roles.length && !message.member.roles.cache.some(r => server.modules.levels.allowed.roles.includes(r.id))) return false

        const activity = await self.db.activities.fetch({ _id: message.guild.id })
        let levels = activity.levels.find(level => level.user_id == message.author.id)
        
        if (!levels) {
            const data = {
                user_id: message.author.id,
                experience: { total: 0, current: 0, level: 0 },
                activity: {
                    text: { total_messages: 0, last_message_at: null },
                    voice: { total_time: 0, connected_at: null, disconnected_at: null }
                }
            }

            await self.db.activities.update({ _id: message.guild.id }, {
                $push: { levels: data }
            })

            levels = data
        }

        if (Levels.throttled(levels)) return false

        const current_xp = levels.experience.current, total_xp = levels.experience.total
        const level = levels.experience.level, next_level = 150 + (level * level * 8)

        const points = (Math.floor(Math.random() * 11) + 15) + level

        if ((next_level - current_xp) <= points) {
            await self.db.activities.update({ _id: message.guild.id, 'levels.user_id': message.author.id }, {
                $set: {
                    'levels.$.experience.level': level + 1,
                    'levels.$.experience.current': 0,
                    'levels.$.experience.total': total_xp + (next_level - current_xp),
                    'levels.$.activity.text.last_message_at': Date.now()
                },
                $inc: {
                    'levels.$.activity.text.total_messages': 1
                }
            })

            await Levels.updateAwards(self, server, { member: message.member, level: level + 1 })
            await Levels.sendLevelUpAlert(self, server, { message: message, level: level + 1 })
        }

        else {
            await self.db.activities.update({ _id: message.guild.id, 'levels.user_id': message.author.id }, {
                $set: {
                    'levels.$.activity.text.last_message_at': Date.now()
                },
                $inc: {
                    'levels.$.experience.current': points,
                    'levels.$.experience.total': points,
                    'levels.$.activity.text.total_messages': 1
                }
            })
        }

        await self.emit('moduleExecution', { module: 'Levels: Message Create', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.member.id, name: message.author.tag } })

        return true
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     */
    static async voiceAssign(self, server, state) {
        if (!server.modules.levels.voice) return false

        if (server.modules.levels.blocked.channels.includes(state.channelID) || state.member.roles.cache.some(r => server.modules.levels.blocked.roles.includes(r.id))) return false
        if (server.modules.levels.allowed.channels.length && !server.modules.levels.allowed.channels.includes(state.channelID)) return false
        if (server.modules.levels.allowed.roles.length && !state.member.roles.cache.some(r => server.modules.levels.allowed.roles.includes(r.id))) return false
        if (state.guild.afkChannelID === state.channelID) return false

        const members = state.channel.members.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

        if (members.size > 1) {
            for (const [_, member] of members) {
                const activity = await self.db.activities.fetch({ _id: member.guild.id })
                let levels = activity.levels.find(level => level.user_id == member.id)
                
                if (!levels) {
                    const data = {
                        user_id: member.id,
                        experience: { total: 0, current: 0, level: 0 },
                        activity: {
                            text: { total_messages: 0, last_message_at: null },
                            voice: { total_time: 0, connected_at: null, disconnected_at: null }
                        }
                    }

                    await self.db.activities.update({ _id: member.guild.id }, {
                        $push: { levels: data }
                    })

                    levels = data
                }

                if (!levels.activity.voice.connected_at) {
                    await self.db.activities.update({ _id: member.guild.id, 'levels.user_id': member.id }, {
                        $set: {
                            'levels.$.activity.voice.connected_at': Date.now(),
                            'levels.$.activity.voice.disconnected_at': null
                        }
                    })
                }
            }

            await self.emit('moduleExecution', { module: 'Levels: Voice Assign', guild: { id: state.member.guild.id, name: state.member.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
        }
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     * @param {import('discord.js').VoiceChannel} channel
     */
    static async voiceUnassign(self, server, state, channel) {
        const members = channel?.members?.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

        if (members) {
            if (members.size === 1) {
                await Levels.voiceCount(self, server, state.member)
                await Levels.voiceCount(self, server, members.first())
            }

            if (members.size >= 2) {
                await Levels.voiceCount(self, server, state.member)
            }
        }
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} member
     */
    static async voiceCount(self, server, member) {
        const activity = await self.db.activities.fetch({ _id: member.guild.id })
        const levels = activity.levels.find(level => level.user_id == member.id)

        if (!levels || !levels.activity.voice.connected_at) return null

        const current_xp = levels.experience.current
        const level = levels.experience.level, next_level = 150 + (level * level * 8)

        const time = (Date.now() - levels.activity.voice.connected_at) / 1000
        const points = ((time/60) * (time/60/60 <= 0 ? 1 : time/60/60) + ((5/100) * time)) * ((10/100) * level < 1 ? 1 : (10/100) * level)

        if ((next_level - current_xp) <= points) {
            let new_level, new_current_xp

            for (new_level = level, new_current_xp = points + current_xp; new_current_xp >= neededXp(new_level); new_current_xp -= neededXp(new_level), new_level++) {}

            await self.db.activities.update({ _id: member.guild.id, 'levels.user_id': member.id }, {
                $set: {
                    'levels.$.experience.level': new_level,
                    'levels.$.experience.current': Number(new_current_xp.toFixed(2)),
                    'levels.$.experience.total': Number((neededTotalXp(new_level) + new_current_xp).toFixed(2)),
                    'levels.$.activity.voice.connected_at': null,
                    'levels.$.activity.voice.disconnected_at': Date.now()
                },
                $inc: {
                    'levels.$.activity.voice.total_time': Number(time.toFixed(2))
                }
            })

            await Levels.updateAwards(self, server, { member, level: new_level })
            await Levels.sendLevelUpAlert(self, server, { member, level: new_level })
        }

        else {
            await self.db.activities.update({ _id: member.guild.id, 'levels.user_id': member.id }, {
                $inc: {
                    'levels.$.experience.current': Number(points.toFixed(2)),
                    'levels.$.experience.total': Number(points.toFixed(2)),
                    'levels.$.activity.voice.total_time': Number(time.toFixed(2))
                },
                $set: {
                    'levels.$.activity.voice.connected_at': null,
                    'levels.$.activity.voice.disconnected_at': Date.now(),
                }
            })
        }

        await self.emit('moduleExecution', { module: 'Levels: Voice Count', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })

        return true
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {object} refs
     * @param {import('discord.js').GuildMember} refs.member
     * @param {number} refs.level
     */
    static async updateAwards(self, server, refs) {
        const member = refs.member

        const awards = server.modules.levels.awards.sort((a, b) => b.level - a.level)
        const reward = awards.find(award => award.level === refs.level)

        const less_awards = awards.filter(award => award.level < refs.level).sort((a, b) => b.level - a.level)
        const less_reward = less_awards[0] || null

        if (reward) {
            if (reward.type === 'ROLE') {
                const roles = member.guild.roles.cache.filter(r => r.editable && reward.references.includes(r.id))

                if (roles.size) {
                    if (!roles.some(r => member.roles.cache.has(r.id))) await member.roles.add(roles).catch(self.logger.error)

                    if (less_reward && less_reward.single) {
                        const less_roles = member.guild.roles.cache.filter(r => r.editable && less_reward.references.includes(r.id))

                        if (less_roles.size) {
                            if (less_roles.some(r => member.roles.cache.has(r.id))) await member.roles.remove(less_roles).catch(self.logger.error)
                        }
                    }
                }
            }

            await self.emit('moduleExecution', { module: 'Levels: Update Awards', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        }

        if (!reward && less_reward) {
            if (less_reward.type === 'ROLE') {
                const roles = member.guild.roles.cache.filter(r => r.editable && less_reward.references.includes(r.id))

                if (roles.size) {
                    if (!roles.some(r => member.roles.cache.has(r.id))) await member.roles.add(roles).catch(self.logger.error)

                    if (less_awards[1] && less_awards[1].single) {
                        const less_roles = member.guild.roles.cache.filter(r => r.editable && less_awards[1].references.includes(r.id))

                        if (less_roles.size) {
                            if (less_roles.some(r => member.roles.cache.has(r.id))) await member.roles.remove(less_roles).catch(self.logger.error)
                        }
                    }
                }
            }

            await self.emit('moduleExecution', { module: 'Levels: Update Less Awards', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        }
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {object} refs
     * @param {import('discord.js').Message} [refs.message]
     * @param {import('discord.js').GuildMember} [refs.member]
     * @param {number} refs.level
     */
    static async sendLevelUpAlert(self, server, refs) {
        const member = refs.message ? refs.message.member : refs.member

        const award = server.modules.levels.awards.find(a => a.level === refs.level)
        const direction = award && award.alert && award.alert.active ? award.alert : server.modules.levels.level_up_alerts

        if (direction.active) {
            const congrats = await Replacer.ReplaceMessageTemplate(self, direction.message, { message: refs.message, guild: member.guild, member: member })

            if (direction.format === 'CURRENT_CHANNEL' && refs.message) {
                await refs.message.channel.send(null, congrats).catch(self.logger.error)
            }

            if (direction.format === 'DM') {
                await member.send(null, congrats).catch(self.logger.error)
            }

            if (direction.format === 'CHANNEL') {
                const channel = member.guild.channels.cache.get(direction.channel_id)

                if (channel) await channel.send(null, congrats).catch(self.logger.error)
            }

            await self.emit('moduleExecution', { module: 'Levels: Level Up Alert', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        }
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    static async GenerateRankCard(self, message, args) {
        const activity = await self.db.activities.fetch({ _id: message.guild.id })

        /**
         * @type {import('discord.js').GuildMember}
         */
        const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null) || message.member

        const sorted = activity.levels.sort((a, b) => b.experience.total - a.experience.total)
        let level = sorted.find(lvl => lvl.user_id == mention.id)

        if (!level) {
            level = {
                user_id: mention.id,
                experience: { total: 0, current: 0, level: 0 },
                activity: {
                    text: { total_messages: 0, last_message_at: null },
                    voice: { total_time: 0, connected_at: null, disconnected_at: null }
                }
            }
        }

        const canvas = await Canvas.createCanvas(720, 256)
        const ctx = canvas.getContext('2d')
        
        ctx.save()

        const rect_x = 720, rect_y = 256, border_radius = 40

        ctx.fillStyle = '#13191C'
        ctx.strokeStyle = '#13191C'
        ctx.fillRect(rect_x, rect_y)
        ctx.lineJoin = 'round'
        ctx.lineWidth = border_radius

        ctx.strokeRect(border_radius / 2, border_radius / 2, rect_x - border_radius, rect_y - border_radius)
        ctx.fillRect(border_radius / 2, border_radius / 2, rect_x - border_radius, rect_y - border_radius)

        const avatar = await Canvas.loadImage(mention.user.displayAvatarURL({ format: 'png' }))

        ctx.beginPath()
        ctx.arc(85, 85, 60, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.clip()

        ctx.drawImage(avatar, 25, 25, 120, 120)
        ctx.restore()

        ctx.strokeStyle = '#272E31'
        ctx.beginPath()
        ctx.lineCap = "round"
        ctx.lineWidth = 20
        ctx.moveTo(35, 185)
        ctx.lineTo(685, 185)
        ctx.stroke()
        ctx.restore()

        const formula = 150 + (level.experience.level * level.experience.level * 8)
        const percent = Math.floor((level.experience.current * 100) / formula)
        const progress = Math.floor(650 * percent / 100)

        ctx.strokeStyle = '#00b4fc'
        ctx.beginPath()
        ctx.lineCap = "round"
        ctx.lineWidth = 20
        ctx.moveTo(35, 185)
        ctx.lineTo(35 + progress, 185)
        ctx.stroke()

        ctx.font = '25px Gotham Pro Medium'
        ctx.fillStyle = '#ffffff'
        const username = mention.user.username
        const measure = ctx.measureText(username)
        ctx.fillText(measure.width > 400 ? 'Username' : username, 160, 70, 400)

        ctx.fillStyle = '#545B5F'
        ctx.fillText(`#${mention.user.discriminator}`, measure.width > 400 ? 160 + ctx.measureText('Username').width : 160 + measure.width, 70)

        ctx.strokeStyle = '#545B5F'
        ctx.beginPath()
        ctx.lineCap = "round"
        ctx.lineWidth = 1
        ctx.moveTo(160, 85)
        ctx.lineTo(695, 85)
        ctx.stroke()

        const place = await Canvas.loadImage('./assets/trophy.svg')
        const lvl = await Canvas.loadImage('./assets/star.svg')
        const messages = await Canvas.loadImage('./assets/messages.png')
        const microphone = await Canvas.loadImage('./assets/microphone.png')

        ctx.font = '25px Gotham Pro Medium'
        ctx.fillStyle = '#ffffff'

        ctx.textAlign = 'end'
        const m2 = ctx.measureText(`#${sorted.indexOf(level) + 1}`)
        ctx.fillText(`#${sorted.indexOf(level) + 1}`, 695, 70)
        ctx.font = '20px Gotham Pro Medium'
        ctx.fillStyle = '#545B5F'
        ctx.fillText('TOP', 690 - m2.width, 70)
        //ctx.drawImage(place, (690 - 25) - m2.width, 48, 25, 25)

        ctx.textAlign = 'start'
        const m4 = ctx.measureText('LV.')
        ctx.fillText('LV.', 160, 117)
        ctx.font = '25px Gotham Pro Medium'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(level.experience.level, 165 + m4.width, 117)
        //ctx.drawImage(lvl, 160, 95, 25, 25)

        ctx.font = '22px Gotham Pro Medium'
        ctx.fillStyle = '#545B5F'
        ctx.textAlign = 'end'
        const m3 = ctx.measureText(level.activity.text.total_messages)
        ctx.fillText(level.activity.text.total_messages, 695, 117)
        ctx.drawImage(messages, (690 - 25) - m3.width, 95, 25, 25)

        const voice_time = numbro(level.activity.voice.total_time).format({ output: 'time' })
        const m5 = ctx.measureText(voice_time)
        ctx.fillText(voice_time, 620, 117)
        ctx.drawImage(microphone, (615 - 25) - m5.width, 95, 25, 25)

        const current_xp_format = level.experience.current >= 1000 ? numbro(Math.floor(level.experience.current)).format({ average: true, mantissa: 2 }).toUpperCase() : Math.floor(level.experience.current)
        const next_xp_format = formula >= 1000 ? numbro(formula).format({ average: true, mantissa: 2 }).toUpperCase() : formula

        ctx.textBaseline = 'top'
        ctx.font = '20px Gotham Pro Medium'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'start'
        ctx.fillText(current_xp_format, 25, 205)

        ctx.textAlign = 'end'
        ctx.fillText(next_xp_format, 695, 205)

        return new MessageAttachment(canvas.toBuffer(), `lacuna-rank-${Date.now()}.png`)
    }

    /**
     * @param {import('../internals/Lacuna')} self
     */
    static async checkVoiceStates(self) {
        const rule = new RecurrenceRule()
        rule.minute = new Range(0, 59, 20)

        scheduleJob(rule, async () => {
            if (!self.readyTimestamp) return null

            let servers = await self.db.servers.findSome({ 'modules.levels.voice': true })

            servers = servers.filter(s => self.guilds.cache.has(s._id))

            for (const server of servers) {
                const activities = await self.db.activities.find({ _id: server._id })

                if (activities) {
                    const guild = self.guilds.cache.get(server._id)
                    const in_voice = activities.levels.filter(level => level.activity.voice.connected_at)

                    for (const user of in_voice) {
                        const state = guild.voiceStates.cache.some(voice => voice?.member?.id == user.user_id && voice.channelID != guild.afkChannelID && voice?.channel?.members?.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)?.size > 1)

                        if (!state) {
                            const member = await guild.members._fetchSingle({ user: user.user_id })

                            if (member) await Levels.voiceCount(self, server, member)
                        }
                        
                        else {
                            await self.db.activities.update({ _id: guild.id, 'levels.user_id': user.user_id }, {
                                $set: {
                                    'levels.$.activity.voice.connected_at': null,
                                    'levels.$.activity.voice.disconnected_at': Date.now()
                                }
                            })
                        }
                    }
                }
            }
        })
    }
}

function neededXp (level) { return 150 + (level * level * 8) }
function neededTotalXp (level) {
    let total = 0

    for (let i = 0; i < level; i++) {
        total += 150 + (i * i * 8)
    }

    return total
}

module.exports = Levels
