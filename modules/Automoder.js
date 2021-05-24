const TemporaryBan = require('../internals/structures/TemporaryBan')
const TemporaryMute = require('../internals/structures/TemporaryMute')
const Replacer = require('./Replacer')

const usersInSlowdown = new Map()

class Automoder {
    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async swearFilter(self, server, message) {
        const config = server.moderation.automoder.swear_filter

        if (!config.active) return false
        //if (message.member.hasPermission('MANAGE_MESSAGES')) return false

        if (config.ignored.channels.includes(message.channel.id)) return false
        if (message.member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

        const content = message.content.toLowerCase()
        const split = content.split(/\s{1,}/)

        if (config.registry.some(reg => split.includes(reg))) {
            const tempban = (config.penalty.action & 1 << 0) === (1 << 0)
            const tempmute = (config.penalty.action & 1 << 1) === (1 << 1)
            const send_message = ((config.penalty.action & 1 << 2) === (1 << 2))
            const delete_message = (config.penalty.action & 1 << 3) === (1 << 3)

            if (tempban && !tempmute && config.penalty.timer) {
                new TemporaryBan(self, {
                    user_id: message.author.id,
                    guild_id: message.guild.id,
                    expires_timestamp: Date.now() + (config.penalty.timer * 1000),
                    reason: 'Автомодер: Фильтр плохих слов',
                    init: true
                })
            }

            if (!tempban && tempmute && config.penalty.timer) {
                const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
                const __tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

                if (mute_role && !__tempmute && !mute_role.members.has(message.author.id)) {
                    new TemporaryMute(self, {
                        user_id: message.author.id,
                        guild_id: message.guild.id,
                        role_id: mute_role.id,
                        expires_timestamp: Date.now() + (config.penalty.timer * 1000),
                        reason: 'Автомодер: Фильтр плохих слов',
                        init: true
                    })
                }
            }

            if (send_message && (config.penalty.message.content || config.penalty.message.embed.active)) {
                const content = await Replacer.ReplaceMessageTemplate(self, config.penalty.message, { message: message, guild: message.guild, member: message.member })

                await message.channel.send(null, content)
            }

            if (!config.penalty.action || delete_message) {
                if (message.deletable && !message.deleted) await message.delete()

                return true
            }

            await self.emit('moduleExecution', { module: 'Automoder: Swear Filter', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
        }
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async linksFilter(self, server, message) {
        const config = server.moderation.automoder.links_filter

        if (!config.active) return false
        if (message.member.hasPermission('MANAGE_MESSAGES')) return false

        if (config.ignored.channels.includes(message.channel.id)) return false
        if (message.member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

        const content = message.content.toLowerCase()
        const split = content.split(/\s{1,}/)
        const links = message.content.match(/(https?:\/\/[^\s]+)/gi)

        if (links && links.length) {
            const delete_referral_invites = config.delete_referral_invites && links.some(link => link.includes('discord.gg'))

            if (config.delete_all_links && !delete_referral_invites && !config.allowed_registry.some(reg => links.some(link => link.includes(reg)))) {
                if (message.deletable && !message.deleted) await message.delete()

                await Penalties.linksPenalty(self, server, message)

                return true
            }
        }

        if (config.delete_referral_invites) {
            const guild_invites = await message.guild.fetchInvites()
            const invites = message.content.match(/discord.gg\/\w+/gi)
            const is_referral = invites ? invites.some(i => !guild_invites.some(k => k.url == `https://${i}`)) : false
            
            if (is_referral) {
                if (message.deletable && !message.deleted) await message.delete()

                await Penalties.linksPenalty(self, server, message)

                return true
            }
        }

        if (config.registry.some(reg => split.some(s => s.includes(reg)))) {
            await Penalties.linksPenalty(self, server, message)

            return true
        }

        return false
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async slowdownUser(self, server, message) {
        const config = server.moderation.automoder.users_slowdown

        if (!config.active) return false
        if (message.member.hasPermission('MANAGE_MESSAGES')) return false

        if (config.ignored.channels.includes(message.channel.id)) return false
        if (message.member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

        let slowdowner = usersInSlowdown.get(message.author.id)
        if (!slowdowner) slowdowner = usersInSlowdown.set(message.author.id, { messages: 0, messages_id: [], timeout: null }).get(message.author.id)

        await slowdowner.messages++
        await slowdowner.messages_id.push(message.id)

        if (!slowdowner.timeout) {
            slowdowner.timeout = setTimeout(() => usersInSlowdown.delete(message.author.id), 5000)
        }

        if (slowdowner.messages > config.messages_limit) {
            const tempban = (config.penalty.action & 1 << 0) === (1 << 0)
            const tempmute = (config.penalty.action & 1 << 1) === (1 << 1)
            const send_message = ((config.penalty.action & 1 << 2) === (1 << 2))
            const delete_message = (config.penalty.action & 1 << 3) === (1 << 3)

            if (tempban && !tempmute && config.penalty.timer) {
                new TemporaryBan(self, {
                    user_id: message.author.id,
                    guild_id: message.guild.id,
                    expires_timestamp: Date.now() + (config.penalty.timer * 1000),
                    reason: 'Автомодер: Замедление отправки сообщений',
                    init: true
                })
            }

            if (!tempban && tempmute && config.penalty.timer) {
                const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
                const __tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

                if (mute_role && !__tempmute && !mute_role.members.has(message.author.id)) {
                    new TemporaryMute(self, {
                        user_id: message.author.id,
                        guild_id: message.guild.id,
                        role_id: mute_role.id,
                        expires_timestamp: Date.now() + (config.penalty.timer * 1000),
                        reason: 'Автомодер: Замедление отправки сообщений',
                        init: true
                    })
                }
            }

            if (send_message) {
                const default_content = self.translator.locale(server.locale).modules.automoder.default_slowdown_message

                const content = await Replacer.ReplaceMessageTemplate(self, config.penalty.message || default_content, { message: message, guild: message.guild, member: message.member })

                await message.channel.send(null, content)
            }

            if (!config.penalty.action || delete_message) {
                try {
                    await message.channel.bulkDelete(slowdowner.messages_id, true)
                } catch (err) {
                    
                }

                return true
            }

            clearTimeout(slowdowner.timeout)
            await usersInSlowdown.delete(message.author.id)

            await self.emit('moduleExecution', { module: 'Automoder: Users Slowdown', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })

            return true
        }

        return false
    }
}

class Penalties {
    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async linksPenalty(self, server, message) {
        const config = server.moderation.automoder.links_filter

        const tempban = (config.penalty.action & 1 << 0) === (1 << 0)
        const tempmute = (config.penalty.action & 1 << 1) === (1 << 1)
        const send_message = (config.penalty.action & 1 << 2) === (1 << 2)
        const delete_message = (config.penalty.action & 1 << 3) === (1 << 3)

        if (tempban && !tempmute && config.penalty.timer) {
            new TemporaryBan(self, {
                user_id: message.author.id,
                guild_id: message.guild.id,
                expires_timestamp: Date.now() + (config.penalty.timer * 1000),
                reason: 'Автомодер: Фильтр ссылок',
                init: true
            })
        }

        if (!tempban && tempmute && config.penalty.timer) {
            const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
            const tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

            if (mute_role && !tempmute && !mute_role.members.has(message.author.id)) {
                new TemporaryMute(self, {
                    user_id: message.author.id,
                    guild_id: message.guild.id,
                    role_id: mute_role.id,
                    expires_timestamp: Date.now() + (config.penalty.timer * 1000),
                    reason: 'Автомодер: Фильтр ссылок',
                    init: true
                })
            }
        }

        if (send_message && (config.penalty.message.content || config.penalty.message.embed.active)) {
            const content = await Replacer.ReplaceMessageTemplate(self, config.penalty.message, { message: message, guild: message.guild, member: message.member })

            await message.channel.send(null, content)
        }

        if (!config.penalty.action || delete_message) {
            if (message.deletable && !message.deleted) await message.delete()

            return true
        }

        await self.emit('moduleExecution', { module: 'Automoder: Links Filter', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
    }
}

module.exports = Automoder