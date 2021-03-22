const { MessageEmbed } = require('discord.js')
const { TruncateString } = require('../internals/utility/Utils')
const moment = require('moment')

class Logs {
    static get images() {
        return {
            BAN_ADD: 'https://i.imgur.com/tfSm8aN.png',
            BAN_ADD_TEMP: 'https://i.imgur.com/Q7plUGo.png',
            BAN_REMOVE: 'https://i.imgur.com/NLCI4I3.png',
            KICK: 'https://i.imgur.com/wN9N2jk.png',
            MUTE_ADD: 'https://i.imgur.com/1PNNkPW.png',
            MUTE_ADD_TEMP: 'https://i.imgur.com/jCjF7ar.png',
            MUTE_REMOVE: 'https://i.imgur.com/7bhawaJ.png',
            WARN_ADD: 'https://i.imgur.com/YdoUgfu.png',
            WARN_REMOVE: 'https://i.imgur.com/02OscFB.png'
        }
    }

    /**
     * Ведет журнал для события CHANNEL_CREATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildChannel} channel
     */
    static async ChannelCreate(self, server, channel) {
        if (server.moderation.logs.types.channel_create.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_create.channel_id)

            const is_ok = log && channel.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(channel.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await channel.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.channel_create.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: channel.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_create.title)
                    .setDescription(`${channel.name} (${channel.id})`)
                    .addField(locale.logs.common.position, channel.position, true)
                    .addField(locale.logs.channel_create.type, locale.logs.channel_create.types[channel.type] || locale.logs.channel_create.types.unknown, true)
                    .addField(locale.logs.channel_create.types.category, channel.parent ? channel.parent.name : '\u200B', true)
                    .setTimestamp()
                    .setColor(0x43b581)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Channel Create', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события CHANNEL_DELETE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildChannel} channel
     */
    static async ChannelDelete(self, server, channel) {
        if (server.moderation.logs.types.channel_delete.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_delete.channel_id)

            const is_ok = log && channel.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(channel.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await channel.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.channel_delete.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: channel.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_delete.title)
                    .setDescription(`${channel.name} (${channel.id})`)
                    .addField(locale.logs.channel_create.type, locale.logs.channel_create.types[channel.type] || locale.logs.channel_create.types.unknown, true)
                    .addField(locale.logs.channel_create.types.category, channel.parent ? channel.parent.name : '\u200B', true)
                    .setTimestamp()
                    .setColor(0xF04747)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Channel Delete', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события CHANNEL_UPDATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildChannel} before
     * @param {import('discord.js').GuildChannel} channel
     */
    static async ChannelUpdate(self, server, before, channel) {
        if (server.moderation.logs.types.channel_update.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_update.channel_id)

            const is_ok = log && channel.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(channel.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await channel.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.channel_update.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: channel.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }

                if (before.name != channel.name) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.channel_update.title)
                        .setDescription(`${channel.name} (${channel.id})`)
                        .addField('\u200B', self.translator.format(locale.logs.channel_update.name_update, `**${before.name}**`, `**${channel.name}**`), true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.topic != channel.topic) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.channel_update.title)
                        .setDescription(`${channel.name} (${channel.id})`)
                        .addField('\u200B', self.translator.format(locale.logs.channel_update.topic_update, `**${before.topic || '-'}**`, `**${channel.topic || '-'}**`), true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.rateLimitPerUser != channel.rateLimitPerUser) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.channel_update.title)
                        .setDescription(`${channel.name} (${channel.id})`)
                        .addField('\u200B', self.translator.format(locale.logs.channel_update.rate_limit_update, `**${before.rateLimitPerUser || 0}**`, `**${channel.rateLimitPerUser || 0}**`), true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.parentID != channel.parentID) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.channel_update.title)
                        .setDescription(`${channel.name} (${channel.id})`)
                        .addField('\u200B', self.translator.format(locale.logs.channel_update.parent_update, before.parent ? `**${before.parent.name}**` : '**-**', channel.parent ? `**${channel.parent.name}**` : '**-**'), true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.bitrate != channel.bitrate) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.channel_update.title)
                        .setDescription(`${channel.name} (${channel.id})`)
                        .addField('\u200B', self.translator.format(locale.logs.channel_update.bitrate_update, `**${before.bitrate / 1000}**kbps`, `**${channel.bitrate / 1000}**kbps`), true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.userLimit != channel.userLimit) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.channel_update.title)
                        .setDescription(`${channel.name} (${channel.id})`)
                        .addField('\u200B', self.translator.format(locale.logs.channel_update.user_limit_update, `**${before.userLimit}**`, `**${channel.userLimit}**`), true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                await self.emit('moduleExecution', { module: 'Logs: Channel Update', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события GUILD_BAN_ADD
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Guild} guild
     * @param {import('discord.js').User} user
     */
    static async GuildBanAdd(self, server, guild, user) {
        if (server.moderation.logs.types.guild_ban_add.active) {
            const locale = self.translator.locale(server.locale)

            const log = guild.channels.cache.get(server.moderation.logs.types.guild_ban_add.channel_id)

            const is_ok = log && guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.commands.common.case_log.cases.BAN_ADD) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.commands.common.case_log.cases.BAN_ADD)
                    .setDescription(`${user.tag} (${user.id})`)
                    .setTimestamp()
                    .setColor(0xF04747)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Guild Ban Add', guild: { id: guild.id, name: guild.name }, target: { id: user.id, name: user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события GUILD_BAN_REMOVE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Guild} guild
     * @param {import('discord.js').User} user
     */
    static async GuildBanRemove(self, server, guild, user) {
        if (server.moderation.logs.types.guild_ban_remove.active) {
            const locale = self.translator.locale(server.locale)

            const log = guild.channels.cache.get(server.moderation.logs.types.guild_ban_remove.channel_id)

            const is_ok = log && guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.commands.common.case_log.cases.BAN_REMOVE) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.commands.common.case_log.cases.BAN_REMOVE)
                    .setDescription(`${user.tag} (${user.id})`)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Guild Ban Remove', guild: { id: guild.id, name: guild.name }, target: { id: user.id, name: user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события GUILD_MEMBER_ADD
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} member
     */
    static async GuildMemberAdd(self, server, member) {
        if (server.moderation.logs.types.guild_member_add.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_add.channel_id)

            const is_ok = log && member.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(member.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await member.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.guild_member_add.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: member.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(member.user.bot ? locale.logs.guild_member_add.bot_add : locale.logs.guild_member_add.title)
                    .setDescription(`${member.user.tag} (${member.id})`)
                    .addField(locale.logs.common.members, member.guild.memberCount, true)
                    .addField(locale.logs.common.account_created, moment(member.user.createdTimestamp).locale(server.locale).fromNow(), true)
                    .setTimestamp()
                    .setColor(0x43b581)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Guild Member Add', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события GUILD_MEMBER_REMOVE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} member
     */
    static async GuildMemberRemove(self, server, member) {
        if (server.moderation.logs.types.guild_member_remove.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_remove.channel_id)

            const is_ok = log && member.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(member.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await member.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.guild_member_remove.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: member.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(member.user.bot ? locale.logs.guild_member_remove.bot_remove : locale.logs.guild_member_remove.title)
                    .setDescription(`${member.user.tag} (${member.id})`)
                    .addField(locale.logs.common.members, member.guild.memberCount, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xF04747)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Guild Member Remove', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события GUILD_MEMBER_UPDATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} before
     * @param {import('discord.js').GuildMember} member
     */
    static async GuildMemberUpdate(self, server, before, member) {
        if (server.moderation.logs.types.guild_member_update.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_update.channel_id)

            const is_ok = log && member.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(member.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await member.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.guild_member_update.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: member.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }

                if (before.nickname != member.nickname) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.guild_member_update.nickname_update)
                        .setDescription(`${member.user.tag} (${member.id})`)
                        .addField(locale.logs.common.before_changes, before.displayName, true)
                        .addField(locale.logs.common.after_changes, member.displayName, true)
                        .addField('\u200B', '\u200B', true)
                        .setTimestamp()
                        .setColor(0xE19517)
    
                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
    
                    await self.emit('moduleExecution', { module: 'Logs: Guild Member Update', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
                }
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события GUILD_MEMBER_UPDATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Guild} before
     * @param {import('discord.js').Guild} guild
     */
    static async GuildUpdate(self, server, before, guild) {
        if (server.moderation.logs.types.guild_update.active) {
            const locale = self.translator.locale(server.locale)

            const log = guild.channels.cache.get(server.moderation.logs.types.guild_update.channel_id)

            const is_ok = log && guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.logs.guild_update.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }

                if (before.name != guild.name) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.guild_update.title)
                        .setDescription(locale.modules.logs.guild_update.types.name)
                        .addField(locale.modules.logs.common.before_changes, before.name, true)
                        .addField(locale.modules.logs.common.after_changes, guild.name, true)
                        .addField('\u200B', '\u200B', true)
                        .setTimestamp()
                        .setColor(0xE19517)
    
                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.region != guild.region) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.guild_update.title)
                        .setDescription(locale.commands.server.texts.region)
                        .addField(locale.modules.logs.common.before_changes, locale.commands.server.texts.regions[before.region], true)
                        .addField(locale.modules.logs.common.after_changes, locale.commands.server.texts.regions[guild.region], true)
                        .addField('\u200B', '\u200B', true)
                        .setTimestamp()
                        .setColor(0xE19517)
    
                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.afkChannelID != guild.afkChannelID) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.guild_update.title)
                        .setDescription(locale.commands.server.texts.afk_channel)
                        .addField(locale.modules.logs.common.before_changes, before.afkChannel ? before.afkChannel.name : locale.commands.common.texts.none, true)
                        .addField(locale.modules.logs.common.after_changes, guild.afkChannel ? guild.afkChannel.name : locale.commands.common.texts.none, true)
                        .addField('\u200B', '\u200B', true)
                        .setTimestamp()
                        .setColor(0xE19517)
    
                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.afkTimeout != guild.afkTimeout) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.guild_update.title)
                        .setDescription(locale.modules.logs.guild_update.types.afk_timeout)
                        .addField(locale.modules.logs.common.before_changes, before.afkTimeout, true)
                        .addField(locale.modules.logs.common.after_changes, guild.afkTimeout, true)
                        .addField('\u200B', '\u200B', true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.verificationLevel != guild.verificationLevel) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.guild_update.title)
                        .setDescription(locale.commands.server.texts.verification_level)
                        .addField(locale.modules.logs.common.before_changes, locale.commands.server.texts.verification_levels[before.verificationLevel], true)
                        .addField(locale.modules.logs.common.after_changes, locale.commands.server.texts.verification_levels[guild.verificationLevel], true)
                        .addField('\u200B', '\u200B', true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.description != guild.description) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.guild_update.title)
                        .setDescription(locale.modules.logs.guild_update.types.description)
                        .addField(locale.modules.logs.common.before_changes, before.description || locale.commands.common.texts.none, true)
                        .addField(locale.modules.logs.common.after_changes, guild.description || locale.commands.common.texts.none, true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.systemChannelID != guild.systemChannelID) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.guild_update.title)
                        .setDescription(locale.modules.logs.guild_update.types.system_channel)
                        .addField(locale.modules.logs.common.before_changes, before.systemChannel ? `#${before.systemChannel.name}` : locale.commands.common.texts.none, true)
                        .addField(locale.modules.logs.common.after_changes, guild.systemChannel ? `#${guild.systemChannel.name}` : locale.commands.common.texts.none, true)
                        .addField('\u200B', '\u200B', true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.ownerID != guild.ownerID) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.guild_update.title)
                        .setDescription(locale.commands.server.texts.owner)
                        .addField(locale.modules.logs.common.before_changes, before.owner ? before.owner.user.tag : `<@${before.ownerID}>`, true)
                        .addField(locale.modules.logs.common.after_changes, guild.owner ? guild.owner.user.tag : `<@${guild.ownerID}>`, true)
                        .addField('\u200B', '\u200B', true)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                await self.emit('moduleExecution', { module: 'Logs: Guild Update', guild: { id: guild.id, name: guild.name }, target: { id: guild.id, name: guild.name } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события INVITE_CREATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Invite} invite
     */
    static async InviteCreate(self, server, invite) {
        if (server.moderation.logs.types.invite_create.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = invite.guild.channels.cache.get(server.moderation.logs.types.invite_create.channel_id)

            const is_ok = log && invite.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(invite.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await invite.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.invite_create.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: invite.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.invite_create.title)
                    .addField(locale.logs.common.invite_code, `[${invite.code}](${invite.url})`, true)
                    .addField(locale.logs.common.channel, `<#${invite.channel.id}>`, true)
                    .addField(locale.logs.common.invite_inviter, invite.inviter ? `${invite.inviter.tag}` : '\u200B', true)
                    .setTimestamp()
                    .setColor(0x43b581)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Invite Create', guild: { id: invite.guild.id, name: invite.guild.name }, target: { id: invite.channel.name, name: invite.code } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события INVITE_DELETE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Invite} invite
     */
    static async InviteDelete(self, server, invite) {
        if (server.moderation.logs.types.invite_delete.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = invite.guild.channels.cache.get(server.moderation.logs.types.invite_delete.channel_id)

            const is_ok = log && invite.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(invite.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await invite.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.invite_delete.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: invite.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.invite_create.title)
                    .addField(locale.logs.common.invite_code, invite.code, true)
                    .addField(locale.logs.common.channel, `<#${invite.channel.id}>`, true)
                    .addField(locale.logs.common.invite_inviter, invite.inviter ? `${invite.inviter.tag}` : '\u200B', true)
                    .setTimestamp()
                    .setColor(0xF04747)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Invite Delete', guild: { id: invite.guild.id, name: invite.guild.name }, target: { id: invite.channel.name, name: invite.code } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события MESSAGE_DELETE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async MessageDelete(self, server, message) {
        if (server.moderation.logs.types.message_delete.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = message.guild.channels.cache.get(server.moderation.logs.types.message_delete.channel_id)

            const is_ok = log && message.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(message.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const content = TruncateString(message.content || '', 800)

                const webhooks = await message.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_delete.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: message.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }

                const attachment = message.attachments.first()
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.message_delete.title)
                    .addField(locale.logs.common.sender, `${message.author.tag}\n(${message.author.id})`, true)
                    .addField(locale.logs.common.channel, `<#${message.channel.id}>`, true)
                    .addField(locale.logs.message_delete.content, content || `\`[${locale.logs.message_delete.attachment}]\``)
                    .setFooter(message.id)
                    .setTimestamp()
                    .setColor(0xF04747)

                if (attachment && attachment.height) embed.setImage(attachment.url)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Message Delete', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события MESSAGE_DELETE_BULK
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Collection<String, import('discord.js').Message>} messages
     */
    static async MessageDeleteBulk(self, server, messages) {
        if (server.moderation.logs.types.message_delete_bulk.active) {
            const message = messages.first()
            const locale = self.translator.locale(server.locale).modules

            const log = message.guild.channels.cache.get(server.moderation.logs.types.message_delete_bulk.channel_id)

            const is_ok = log && message.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(message.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await message.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_delete_bulk.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: message.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.message_delete_bulk.title)
                    .addField(locale.logs.message_delete_bulk.amount, messages.size, true)
                    .addField(locale.logs.common.channel, `<#${message.channel.id}>`, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xF04747)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Message Delete Bulk', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author ? message.author.id : message.id, name: message.author ? message.author.tag : message.type } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события MESSAGE_UPDATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} before
     * @param {import('discord.js').Message} message
     */
    static async MessageUpdate(self, server, before, message) {
        if (server.moderation.logs.types.message_update.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = message.guild.channels.cache.get(server.moderation.logs.types.message_update.channel_id)

            const is_ok = log && message.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(message.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const before_content = TruncateString(before.content || '', 800)
                const content = TruncateString(message.content || '', 800)

                const webhooks = await message.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_update.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: message.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }

                const attachment = message.attachments.first()
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.message_update.title)
                    .addField(locale.logs.common.sender, `${message.author.tag}\n(${message.author.id})`, true)
                    .addField(locale.logs.common.channel, `<#${message.channel.id}>`, true)
                    .addField(locale.logs.message_update.content_before_update, before_content || '\u200B')
                    .addField(locale.logs.message_update.content_after_update, content || '\u200B')
                    .setFooter(message.id)
                    .setTimestamp()
                    .setColor(0xE19517)

                if (attachment && attachment.height) embed.setImage(attachment.url)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Message Update', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события ROLE_CREATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Role} role
     */
    static async RoleCreate(self, server, role) {
        if (server.moderation.logs.types.role_create.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = role.guild.channels.cache.get(server.moderation.logs.types.role_create.channel_id)

            const is_ok = log && role.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(role.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await role.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.role_create.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: role.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.role_create.title)
                    .addField(locale.logs.common.role_name, role.name, true)
                    .addField(locale.logs.common.position, role.position, true)
                    .setFooter(role.id)
                    .setTimestamp()
                    .setColor(0x43b581)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Role Create', guild: { id: role.guild.id, name: role.guild.name }, target: { id: role.name, name: role.id } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события ROLE_DELETE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Role} role
     */
    static async RoleDelete(self, server, role) {
        if (server.moderation.logs.types.role_delete.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = role.guild.channels.cache.get(server.moderation.logs.types.role_delete.channel_id)

            const is_ok = log && role.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(role.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await role.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.role_delete.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: role.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.role_delete.title)
                    .addField(locale.logs.common.role_name, role.name, true)
                    .addField(locale.logs.common.position, role.position, true)
                    .setFooter(role.id)
                    .setTimestamp()
                    .setColor(0xF04747)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Role Delete', guild: { id: role.guild.id, name: role.guild.name }, target: { id: role.name, name: role.id } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события ROLE_MEMBER_ADD
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} member
     * @param {import('discord.js').Role} role
     */
    static async RoleMemberAdd(self, server, member, role) {
        if (server.moderation.logs.types.role_member_add.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = member.guild.channels.cache.get(server.moderation.logs.types.role_member_add.channel_id)

            const is_ok = log && member.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(member.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await member.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.role_member_add.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: member.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.role_member_add.title)
                    .addField(member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${member.user.tag}\n(${member.user.id})`, true)
                    .addField(locale.logs.common.role, `<@&${role.id}>`, true)
                    .setTimestamp()
                    .setColor(0x43b581)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Role Member Add', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события ROLE_MEMBER_REMOVE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} member
     * @param {import('discord.js').Role} role
     */
    static async RoleMemberRemove(self, server, member, role) {
        if (server.moderation.logs.types.role_member_remove.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = member.guild.channels.cache.get(server.moderation.logs.types.role_member_remove.channel_id)

            const is_ok = log && member.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(member.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await member.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.role_member_remove.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: member.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.role_member_remove.title)
                    .addField(member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${member.user.tag}\n(${member.user.id})`, true)
                    .addField(locale.logs.common.role, `<@&${role.id}>`, true)
                    .setTimestamp()
                    .setColor(0xF04747)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Role Member Remove', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события ROLE_UPDATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Role} before
     * @param {import('discord.js').Role} role
     */
    static async RoleUpdate(self, server, before, role) {
        if (server.moderation.logs.types.role_update.active) {
            const locale = self.translator.locale(server.locale)

            const log = role.guild.channels.cache.get(server.moderation.logs.types.role_update.channel_id)

            const is_ok = log && role.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(role.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await role.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.modules.logs.role_update.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: role.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }

                if (before.name != role.name) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.role_update.title)
                        .setDescription(`${role.name}: ${locale.modules.logs.common.role_name}`)
                        .addField(locale.modules.logs.common.before_changes, before.name, true)
                        .addField(locale.modules.logs.common.after_changes, role.name, true)
                        .setFooter(role.id)
                        .setTimestamp()
                        .setColor(0xF04747)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.hexColor != role.hexColor) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.role_update.title)
                        .setDescription(`${role.name}: ${locale.modules.logs.role_update.types.color}`)
                        .addField(locale.modules.logs.common.before_changes, before.hexColor, true)
                        .addField(locale.modules.logs.common.after_changes, role.hexColor, true)
                        .setFooter(role.id)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }
                
                if (before.permissions != role.permissions) {
                    const before_permissions = before.permissions.toArray(false)
                    const permissions = role.permissions.toArray(false)

                    if (before_permissions.length < permissions.length) {
                        const perms = permissions.filter(p => !before_permissions.includes(p))

                        const embed = new MessageEmbed()
                            .setTitle(locale.modules.logs.role_update.title)
                            .setDescription(role.name)
                            .addField(locale.modules.logs.role_update.types.permissions_added, perms.map(p => locale.commands.common.permissions[p]).join(', '), true)
                            .addField('\u200B', '\u200B', true)
                            .setFooter(role.id)
                            .setTimestamp()
                            .setColor(0xE19517)

                        await webhook.send('', {
                            embeds: [embed],
                            avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                            name: server.server.premium.available ? webhook.name : self.user.username
                        })
                    }

                    if (before_permissions.length > permissions.length) {
                        const perms = before_permissions.filter(p => !permissions.includes(p))

                        const embed = new MessageEmbed()
                            .setTitle(locale.modules.logs.role_update.title)
                            .setDescription(role.name)
                            .addField(locale.modules.logs.role_update.types.permissions_removed, perms.map(p => locale.commands.common.permissions[p]).join(', '), true)
                            .addField('\u200B', '\u200B', true)
                            .setFooter(role.id)
                            .setTimestamp()
                            .setColor(0xE19517)

                        await webhook.send('', {
                            embeds: [embed],
                            avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                            name: server.server.premium.available ? webhook.name : self.user.username
                        })
                    }
                }

                await self.emit('moduleExecution', { module: 'Logs: Role Update', guild: { id: role.guild.id, name: role.guild.name }, target: { id: role.name, name: role.id } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события USER_UPDATE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Guild} guild
     * @param {import('discord.js').User} before
     * @param {import('discord.js').User} user
     */
    static async UserUpdate(self, server, guild, before, user) {
        if (server.moderation.logs.types.user_update.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = guild.channels.cache.get(server.moderation.logs.types.user_update.channel_id)

            const is_ok = log && guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.user_update.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }

                if (before.username != user.username) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.user_update.title)
                        .setDescription(`${user.tag}: ${locale.logs.user_update.types.username}`)
                        .addField(locale.logs.common.before_changes, before.username, true)
                        .addField(locale.logs.common.after_changes, user.username, true)
                        .setFooter(user.id)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before.discriminator != user.discriminator) {
                    const embed = new MessageEmbed()
                        .setTitle(locale.logs.user_update.title)
                        .setDescription(`${user.tag}: ${locale.logs.user_update.types.discriminator}`)
                        .addField(locale.logs.common.before_changes, before.discriminator, true)
                        .addField(locale.logs.common.after_changes, user.discriminator, true)
                        .setFooter(user.id)
                        .setTimestamp()
                        .setColor(0xE19517)

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                await self.emit('moduleExecution', { module: 'Logs: User Update', guild: { id: guild.id, name: guild.name }, target: { id: user.username, name: user.id } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события VOICE_CONNECT
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     */
    static async VoiceConnect(self, server, state) {
        if (server.moderation.logs.types.voice_connect.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_connect.channel_id)

            const is_ok = log && state.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(state.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await state.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_connect.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: state.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.voice_connect.title)
                    .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}\n(${state.member.id})`, true)
                    .addField(locale.logs.common.channel, `<#${state.channel.id}>`, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0x43b581)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Voice Connect', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события VOICE_DISCONNECT
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     * @param {import('discord.js').VoiceChannel} channel
     */
    static async VoiceDisconnect(self, server, state, channel) {
        if (server.moderation.logs.types.voice_disconnect.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_disconnect.channel_id)

            const is_ok = log && state.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(state.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await state.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_disconnect.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: state.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.voice_disconnect.title)
                    .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}\n(${state.member.id})`, true)
                    .addField(locale.logs.common.channel, `<#${channel.id}>`, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xF04747)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Voice Disconnect', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события VOICE_MOVE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} before
     * @param {import('discord.js').VoiceState} state
     */
    static async VoiceMove(self, server, before, state) {
        if (server.moderation.logs.types.voice_disconnect.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_move.channel_id)

            const is_ok = log && state.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(state.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await state.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_move.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: state.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.voice_move.title)
                    .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}\n(${state.member.id})`, true)
                    .addField(locale.logs.voice_move.old_channel, `<#${before.channelID}>`, true)
                    .addField(locale.logs.voice_move.new_channel, `<#${state.channelID}>`, true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Voice Move', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события VOICE_SERVER_MUTE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     */
    static async VoiceServerMute(self, server, state) {
        if (server.moderation.logs.types.voice_server_mute.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_mute.channel_id)

            const is_ok = log && state.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(state.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await state.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_mute.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: state.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.voice_server_mute.title)
                    .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}\n(${state.member.id})`, true)
                    .addField(locale.logs.common.channel, `<#${state.channelID}>`, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Voice Server Mute', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события VOICE_SERVER_UNMUTE
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     */
    static async VoiceServerUnmute(self, server, state) {
        if (server.moderation.logs.types.voice_server_unmute.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_unmute.channel_id)

            const is_ok = log && state.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(state.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await state.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_unmute.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: state.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.voice_server_unmute.title)
                    .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}\n(${state.member.id})`, true)
                    .addField(locale.logs.common.channel, `<#${state.channelID}>`, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Voice Server Unmute', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события VOICE_SERVER_DEAF
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     */
    static async VoiceServerDeaf(self, server, state) {
        if (server.moderation.logs.types.voice_server_deaf.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_deaf.channel_id)

            const is_ok = log && state.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(state.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await state.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_deaf.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: state.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.voice_server_deaf.title)
                    .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}\n(${state.member.id})`, true)
                    .addField(locale.logs.common.channel, `<#${state.channelID}>`, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Voice Server Deaf', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
            
                return true
            }
        }

        return false
    }

    /**
     * Ведет журнал для события VOICE_SERVER_UNDEAF
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').VoiceState} state
     */
    static async VoiceServerUndeaf(self, server, state) {
        if (server.moderation.logs.types.voice_server_undeaf.active) {
            const locale = self.translator.locale(server.locale).modules

            const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_undeaf.channel_id)

            const is_ok = log && state.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(state.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await state.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    try {
                        webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_undeaf.title) })
                    } catch (err) {
                        return false
                    }

                    await self.db.servers.update({ _id: state.guild.id }, {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelID
                            }
                        }
                    })
                }
            
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.voice_server_undeaf.title)
                    .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}\n(${state.member.id})`, true)
                    .addField(locale.logs.common.channel, `<#${state.channelID}>`, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Voice Server Undeaf', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
            
                return true
            }
        }

        return false
    }
}

module.exports = Logs