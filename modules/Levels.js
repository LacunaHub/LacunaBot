const Replacer = require('./Replacer')
const Canvas = require('canvas')
const { MessageAttachment } = require('discord.js')

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
    static async Text(self, server, message) {
        if (!server.modules.levels.active) return false

        if (server.modules.levels.blocked.channels.includes(message.channel.id) || message.member.roles.cache.some(r => server.modules.levels.blocked.roles.includes(r.id))) return false
        if (server.modules.levels.allowed.channels.length && !server.modules.levels.allowed.channels.includes(message.channel.id)) return false
        if (server.modules.levels.allowed.roles.length && !message.member.roles.cache.some(r => server.modules.levels.allowed.roles.includes(r.id))) return false

        const activity = await self.db.activities.fetch({ _id: message.guild.id })
        const levels = activity.levels.find(level => level.user_id == message.author.id)
        
        if (!levels) {
            await self.db.activities.update({ _id: message.guild.id }, {
                $push: {
                    levels: {
                        user_id: message.author.id,
                        experience: { total: 0, current: 0, level: 0 },
                        activity: {
                            text: { total_messages: 0, last_message_at: null },
                            voice: { total_time: 0, connected_at: null, disconnected_at: null }
                        }
                    }
                }
            })

            return false
        }

        if (Levels.throttled(levels)) return false

        const current_xp = levels.experience.current, total_xp = levels.experience.total
        const level = levels.experience.level, next_level = 150 + (level * level * 8)

        const points = Math.floor(Math.random() * 11) + (15 + level)

        if ((next_level - current_xp) <= points) {
            const awards = server.modules.levels.awards.sort((a, b) => b.level - a.level)
            const reward = awards.find(award => award.level === (level + 1))

            const less_awards = awards.filter(award => award.level < (level + 1)).sort((a, b) => b.level - a.level)
            const less_reward = less_awards[0] || null

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

            const level_up_alerts = server.modules.levels.level_up_alerts

            if (level_up_alerts.active) {
                const congrats = await Replacer.Replace(self, level_up_alerts.message.content, { message: message, guild: message.guild, member: message.member })

                if (level_up_alerts.format === 0) {
                    await message.channel.send(congrats)
                }

                else if (level_up_alerts.format === 1) {
                    await message.member.send(congrats)
                }

                else if (level_up_alerts.format === 2) {
                    const channel = message.guild.channels.cache.get(level_up_alerts.channel_id)

                    if (channel) await channel.send(congrats)
                }
            }

            if (reward) {
                if (reward.type === 'ROLE') {
                    const roles = message.guild.roles.cache.filter(r => r.editable && reward.references.includes(r.id))

                    if (roles.size) {
                        try {
                            if (!roles.some(r => message.member.roles.cache.has(r.id))) await message.member.roles.add(roles)

                            if (server.modules.levels.single_roles && less_reward) {
                                const less_roles = message.guild.roles.cache.filter(r => r.editable && less_reward.references.includes(r.id))

                                if (less_roles.size) {
                                    if (less_roles.some(r => message.member.roles.cache.has(r.id))) await message.member.roles.remove(less_roles)
                                }
                            }
                        } catch (err) {
                            await self.logger.error('Error at level_role_rewards', err)

                            return false
                        }
                    }
                }
            }

            if (!reward && less_reward) {
                if (less_reward.type === 'ROLE') {
                    const roles = message.guild.roles.cache.filter(r => r.editable && less_reward.references.includes(r.id))

                    if (roles.size) {
                        try {
                            if (!roles.some(r => message.member.roles.cache.has(r.id))) await message.member.roles.add(roles)

                            if (server.modules.levels.single_roles && less_awards[1]) {
                                const less_roles = message.guild.roles.cache.filter(r => r.editable && less_awards[1].references.includes(r.id))

                                if (less_roles.size) {
                                    if (less_roles.some(r => message.member.roles.cache.has(r.id))) await message.member.roles.remove(less_roles)
                                }
                            }
                        } catch (err) {
                            await self.logger.error('Error at level_less_role_rewards', err)

                            return false
                        }
                    }
                }
            }
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

        return true
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    static async GenerateRankCard(self, message, args) {
        const activity = await self.db.activities.fetch({ _id: message.guild.id })

        const mention = message.mentions.users.first() || args[0]

        const member = mention ? await message.guild.members.fetch({ user: mention, cache: false }) : message.member

        const sorted = activity.levels.sort((a, b) => b.experience.total - a.experience.total)
        const level = sorted.find(lvl => lvl.user_id == member.id)

        if (!level) return null

        const canvas = await Canvas.createCanvas(720, 256)
        const ctx = canvas.getContext('2d')
        
        ctx.save()

        const rect_x = 720, rect_y = 256, border_radius = 40

        ctx.fillStyle = '#212121'
        ctx.strokeStyle = '#212121'
        ctx.fillRect(rect_x, rect_y)
        ctx.lineJoin = 'round'
        ctx.lineWidth = border_radius

        ctx.strokeRect(border_radius / 2, border_radius / 2, rect_x - border_radius, rect_y - border_radius)
        ctx.fillRect(border_radius / 2, border_radius / 2, rect_x - border_radius, rect_y - border_radius)

        const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png' }))

        ctx.beginPath()
        ctx.arc(85, 85, 60, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.clip()

        ctx.drawImage(avatar, 25, 25, 120, 120)
        ctx.restore()

        ctx.strokeStyle = '#424242'
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
        const username = member.user.username
        const measure = ctx.measureText(username)
        ctx.fillText(measure.width > 400 ? 'Username' : username, 160, 70, 400)

        ctx.fillStyle = '#424242'
        ctx.fillText(`#${member.user.discriminator}`, measure.width > 400 ? 160 + ctx.measureText('Username').width : 160 + measure.width, 70)

        ctx.strokeStyle = '#424242'
        ctx.beginPath()
        ctx.lineCap = "round"
        ctx.lineWidth = 1
        ctx.moveTo(160, 85)
        ctx.lineTo(695, 85)
        ctx.stroke()

        const place = await Canvas.loadImage('./assets/trophy.svg')
        const lvl = await Canvas.loadImage('./assets/star.svg')
        const messages = await Canvas.loadImage('./assets/incoming_envelope.svg')

        ctx.font = '25px Gotham Pro Medium'
        ctx.fillStyle = '#ffffff'

        ctx.textAlign = 'end'
        const m2 = ctx.measureText(sorted.indexOf(level) + 1)
        ctx.fillText(sorted.indexOf(level) + 1, 695, 70)
        ctx.drawImage(place, (690 - 25) - m2.width, 48, 25, 25)

        ctx.textAlign = 'start'
        ctx.fillText(level.experience.level, 190, 117)
        ctx.drawImage(lvl, 160, 95, 25, 25)

        ctx.textAlign = 'end'
        const m3 = ctx.measureText(level.activity.text.total_messages)
        ctx.fillText(level.activity.text.total_messages, 695, 117)
        ctx.drawImage(messages, (690 - 25) - m3.width, 95, 25, 25)

        ctx.textBaseline = 'top'
        ctx.font = '20px Gotham Pro Medium'
        ctx.textAlign = 'start'
        ctx.fillText(level.experience.current, 25, 205)

        ctx.textAlign = 'end'
        ctx.fillText(formula, 695, 205)

        return new MessageAttachment(canvas.toBuffer(), `lacuna-rank-${Date.now()}.png`)
    }
}

module.exports = Levels