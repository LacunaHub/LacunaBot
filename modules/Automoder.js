const TemporaryBan = require('../internals/structures/TemporaryBan')
const TemporaryMute = require('../internals/structures/TemporaryMute')
const Replacer = require('./Replacer')
const Utils = require('../internals/utility/Utils')
const moment = require('moment')
const Warnings = require('./Warnings')
const unzalgo = require('unzalgo')

const usersInSlowdown = new Map()

const adjectives = ['Foggy', 'Magnanimous', 'Taboo', 'Compulsive', 'Busy', 'Angry', 'Responsive', 'Amiable', 'Nice', 'Unexpected']

class Automoder {
    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async swearFilter(self, server, message) {
        const config = server.moderation.automoder.swear_filter

        if (!config.active) return false
        if (message.member.permissions.any(config.ignored.permissions, false)) return false

        if (config.ignored.channels.includes(message.channel.id)) return false
        if (message.member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

        const content = message.content.toLowerCase()
        const split = content.split(/\s{1,}/)

        if (config.registry.some(reg => split.includes(reg.toLowerCase()))) {
            const ban = (config.penalty.action & 1 << 0) === (1 << 0)
            const mute = (config.penalty.action & 1 << 1) === (1 << 1)
            const send_message = (config.penalty.action & 1 << 2) === (1 << 2)
            const delete_message = (config.penalty.action & 1 << 3) === (1 << 3)
            const kick = (config.penalty.action & 1 << 4) === (1 << 4)
            const warn = (config.penalty.action & 1 << 5) === (1 << 5)

            if (ban && (!mute && !kick)) {
                if (config.penalty.timer) {
                    const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                    new TemporaryBan(self, {
                        user_id: message.author.id,
                        guild_id: message.guild.id,
                        expires_timestamp: expires_timestamp,
                        reason: `Автомодер: Фильтр слов (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                        init: true
                    })
                }

                else {
                    await message.guild.members.ban(message.author.id, { reason: 'Автомодер: Фильтр слов' })
                }
            }

            if (mute && (!ban && !kick)) {
                const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
                const tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

                if (mute_role && !tempmute && !mute_role.members.has(message.author.id)) {
                    if (config.penalty.timer) {
                        const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                        new TemporaryMute(self, {
                            user_id: message.author.id,
                            guild_id: message.guild.id,
                            role_id: mute_role.id,
                            expires_timestamp: expires_timestamp,
                            reason: `Автомодер: Фильтр слов (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                            init: true
                        })
                    }

                    else {
                        if (server.moderation.roles.on_mute.remove_all_roles) {
                            const current_roles = message.member.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)
                
                            await self.db.servers.update({ _id: message.guild.id }, {
                                $push: {
                                    'moderation.roles.on_mute.returnable_roles': {
                                        user_id: message.author.id,
                                        roles: current_roles
                                    }
                                }
                            })
                
                            const strict_roles = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...message.member.roles.cache.filter(r => !r.editable).map(r => r.id)]
                
                            await message.member.roles.set([mute_role.id, ...strict_roles], 'Автомодер: Фильтр слов').catch(self.logger.error)
                        }

                        else {
                            await message.member.roles.add(mute_role.id, 'Автомодер: Фильтр слов')
                        }
                    }
                }
            }

            if (kick && (!ban && !mute)) {
                if (message.member.kickable) await message.member.kick('Автомодер: Фильтр слов')
            }

            if (warn) {
                await Warnings.add(self, server, message, { target: message.member, executor: message.guild.me, reason: 'Автомодер: Фильтр слов' })
            }

            if (send_message && (config.penalty.message.content || config.penalty.message.embed.active)) {
                const content = await Replacer.ReplaceMessageTemplate(self, config.penalty.message, { message: message, guild: message.guild, member: message.member })

                await message.channel.send(null, content)
            }

            if (!config.penalty.action || delete_message) {
                if (message.deletable && !message.deleted) await message.delete()
            }

            await self.emit('moduleExecution', { module: 'Automoder: Swear Filter', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
        
            return true
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
        if (message.member.permissions.any(config.ignored.permissions, false)) return false

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
        if (message.member.permissions.any(config.ignored.permissions, false)) return false

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
            const ban = (config.penalty.action & 1 << 0) === (1 << 0)
            const mute = (config.penalty.action & 1 << 1) === (1 << 1)
            const send_message = (config.penalty.action & 1 << 2) === (1 << 2)
            const delete_message = (config.penalty.action & 1 << 3) === (1 << 3)
            const kick = (config.penalty.action & 1 << 4) === (1 << 4)
            const warn = (config.penalty.action & 1 << 5) === (1 << 5)

            if (ban && (!mute && !kick)) {
                if (config.penalty.timer) {
                    const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                    new TemporaryBan(self, {
                        user_id: message.author.id,
                        guild_id: message.guild.id,
                        expires_timestamp: expires_timestamp,
                        reason: `Автомодер: Замедление отправки сообщений (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                        init: true
                    })
                }

                else {
                    await message.guild.members.ban(message.author.id, { reason: 'Автомодер: Замедление отправки сообщений' })
                }
            }

            if (mute && (!ban && !kick)) {
                const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
                const tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

                if (mute_role && !tempmute && !mute_role.members.has(message.author.id)) {
                    if (config.penalty.timer) {
                        const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                        new TemporaryMute(self, {
                            user_id: message.author.id,
                            guild_id: message.guild.id,
                            role_id: mute_role.id,
                            expires_timestamp: expires_timestamp,
                            reason: `Автомодер: Замедление отправки сообщений (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                            init: true
                        })
                    }

                    else {
                        if (server.moderation.roles.on_mute.remove_all_roles) {
                            const current_roles = message.member.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)
                
                            await self.db.servers.update({ _id: message.guild.id }, {
                                $push: {
                                    'moderation.roles.on_mute.returnable_roles': {
                                        user_id: message.author.id,
                                        roles: current_roles
                                    }
                                }
                            })
                
                            const strict_roles = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...message.member.roles.cache.filter(r => !r.editable).map(r => r.id)]
                
                            await message.member.roles.set([mute_role.id, ...strict_roles], 'Автомодер: Замедление отправки сообщений').catch(self.logger.error)
                        }

                        else {
                            await message.member.roles.add(mute_role.id, 'Автомодер: Замедление отправки сообщений')
                        }
                    }
                }
            }

            if (kick && (!ban && !mute)) {
                if (message.member.kickable) await message.member.kick('Автомодер: Замедление отправки сообщений')
            }

            if (warn) {
                await Warnings.add(self, server, message, { target: message.member, executor: message.guild.me, reason: 'Автомодер: Замедление отправки сообщений' })
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
            }

            clearTimeout(slowdowner.timeout)
            await usersInSlowdown.delete(message.author.id)

            await self.emit('moduleExecution', { module: 'Automoder: Users Slowdown', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })

            return true
        }

        return false
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async antiCaps(self, server, message) {
        const config = server.moderation.automoder.anti_caps

        if (!config.active) return false
        if (message.member.permissions.any(config.ignored.permissions, false)) return false

        if (config.ignored.channels.includes(message.channel.id)) return false
        if (message.member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

        const splitted_case = Utils.splitStringCase(message.content)
        const upper_percent = splitted_case.length ? Math.floor(splitted_case.upper.length * 100 / splitted_case.length) : 0

        if (upper_percent >= config.percentage_of_caps && message.content.length >= config.minimum_content_length) {
            const ban = (config.penalty.action & 1 << 0) === (1 << 0)
            const mute = (config.penalty.action & 1 << 1) === (1 << 1)
            const send_message = (config.penalty.action & 1 << 2) === (1 << 2)
            const delete_message = (config.penalty.action & 1 << 3) === (1 << 3)
            const kick = (config.penalty.action & 1 << 4) === (1 << 4)
            const warn = (config.penalty.action & 1 << 5) === (1 << 5)

            if (ban && (!mute && !kick)) {
                if (config.penalty.timer) {
                    const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                    new TemporaryBan(self, {
                        user_id: message.author.id,
                        guild_id: message.guild.id,
                        expires_timestamp: expires_timestamp,
                        reason: `Автомодер: Анти-капс (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                        init: true
                    })
                }

                else {
                    await message.guild.members.ban(message.author.id, { reason: 'Автомодер: Анти-капс' })
                }
            }

            if (mute && (!ban && !kick)) {
                const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
                const tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

                if (mute_role && !tempmute && !mute_role.members.has(message.author.id)) {
                    if (config.penalty.timer) {
                        const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                        new TemporaryMute(self, {
                            user_id: message.author.id,
                            guild_id: message.guild.id,
                            role_id: mute_role.id,
                            expires_timestamp: expires_timestamp,
                            reason: `Автомодер: Анти-капс (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                            init: true
                        })
                    }

                    else {
                        if (server.moderation.roles.on_mute.remove_all_roles) {
                            const current_roles = message.member.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)
                
                            await self.db.servers.update({ _id: message.guild.id }, {
                                $push: {
                                    'moderation.roles.on_mute.returnable_roles': {
                                        user_id: message.author.id,
                                        roles: current_roles
                                    }
                                }
                            })
                
                            const strict_roles = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...message.member.roles.cache.filter(r => !r.editable).map(r => r.id)]
                
                            await message.member.roles.set([mute_role.id, ...strict_roles], 'Автомодер: Анти-капс').catch(self.logger.error)
                        }

                        else {
                            await message.member.roles.add(mute_role.id, 'Автомодер: Анти-капс')
                        }
                    }
                }
            }

            if (kick && (!ban && !mute)) {
                if (message.member.kickable) await message.member.kick('Автомодер: Анти-капс')
            }

            if (warn) {
                await Warnings.add(self, server, message, { target: message.member, executor: message.guild.me, reason: 'Автомодер: Анти-капс' })
            }

            if (send_message && (config.penalty.message.content || config.penalty.message.embed.active)) {
                const content = await Replacer.ReplaceMessageTemplate(self, config.penalty.message, { message: message, guild: message.guild, member: message.member })

                await message.channel.send(null, content)
            }

            if (!config.penalty.action || delete_message) {
                if (message.deletable && !message.deleted) await message.delete()
            }

            await self.emit('moduleExecution', { module: 'Automoder: Anti Caps', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
        
            return true
        }
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} member
     */
    static async updateNickname(self, server, member) {
        const config = server.moderation.automoder.nicknames

        if (!config.active) return false
        if (member.permissions.any(config.ignored.permissions, false)) return false

        if (member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

        let name = Automoder._adjustNickname(config.types, member.displayName)

        if (!name.length) {
            const random = Math.floor(Math.random() * adjectives.length)

            name = adjectives[random]
        }

        if (member.manageable && name !== member.displayName) {
            await member.setNickname(name, 'Автомодер: Модерирование никнеймов')
        
            await self.emit('moduleExecution', { module: 'Automoder: Nickname Moderation', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        }
    
        return true
    }

    /**
     * @param {*} types
     * @param {string} name
     * @returns {string}
     */
    static _adjustNickname(types, name) {
        const regexps = {
            special_characters: /[-!@#$%\^&*()_=+\[\]\\{};:'"|,<.>\/?]/g,
            emojis: /\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}/gu,
        }

        const split = name.split(/\s{1,}/)

        if (regexps.special_characters.test(name) && types.special_characters) name = name.replace(regexps.special_characters, '')
        if (unzalgo.isZalgo(name) && types.zalgo) name = unzalgo.clean(name)
        if (types.diacritics) name = name.normalize('NFD').replace(/\p{Diacritic}/gu, '')
        if (regexps.emojis.test(name) && types.emojis) name = name.replace(regexps.emojis, '')

        if (types.contains.some(c => split.includes(c))) {
            types.contains.forEach(c => name = name.replace(c, ''))
        }
        
        if (types.regexp.pattern) {
            let regexp = null
            try {
                regexp = new RegExp(types.regexp.pattern, types.regexp.flags.join(''))
            } catch (err) {
                regexp = null
            }

            if (regexp) name = name.replace(regexp, '')
        }

        return name.trim()
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

        const ban = (config.penalty.action & 1 << 0) === (1 << 0)
        const mute = (config.penalty.action & 1 << 1) === (1 << 1)
        const send_message = (config.penalty.action & 1 << 2) === (1 << 2)
        const delete_message = (config.penalty.action & 1 << 3) === (1 << 3)
        const kick = (config.penalty.action & 1 << 4) === (1 << 4)
        const warn = (config.penalty.action & 1 << 5) === (1 << 5)

        if (ban && (!mute && !kick)) {
            if (config.penalty.timer) {
                const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                new TemporaryBan(self, {
                    user_id: message.author.id,
                    guild_id: message.guild.id,
                    expires_timestamp: expires_timestamp,
                    reason: `Автомодер: Фильтр ссылок (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                    init: true
                })
            }

            else {
                await message.guild.members.ban(message.author.id, { reason: 'Автомодер: Фильтр ссылок' })
            }
        }

        if (mute && (!ban && !kick)) {
            const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
            const tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

            if (mute_role && !tempmute && !mute_role.members.has(message.author.id)) {
                if (config.penalty.timer) {
                    const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                    new TemporaryMute(self, {
                        user_id: message.author.id,
                        guild_id: message.guild.id,
                        role_id: mute_role.id,
                        expires_timestamp: expires_timestamp,
                        reason: `Автомодер: Фильтр ссылок (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                        init: true
                    })
                }

                else {
                    if (server.moderation.roles.on_mute.remove_all_roles) {
                        const current_roles = message.member.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)
            
                        await self.db.servers.update({ _id: message.guild.id }, {
                            $push: {
                                'moderation.roles.on_mute.returnable_roles': {
                                    user_id: message.author.id,
                                    roles: current_roles
                                }
                            }
                        })
            
                        const strict_roles = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...message.member.roles.cache.filter(r => !r.editable).map(r => r.id)]
            
                        await message.member.roles.set([mute_role.id, ...strict_roles], 'Автомодер: Фильтр ссылок').catch(self.logger.error)
                    }

                    else {
                        await message.member.roles.add(mute_role.id, 'Автомодер: Фильтр ссылок')
                    }
                }
            }
        }

        if (kick && (!ban && !mute)) {
            if (message.member.kickable) await message.member.kick('Автомодер: Фильтр ссылок')
        }

        if (warn) {
            await Warnings.add(self, server, message, { target: message.member, executor: message.guild.me, reason: 'Автомодер: Фильтр ссылок' })
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