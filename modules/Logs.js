const { MessageEmbed } = require('discord.js')
const { TruncateString } = require('../internals/utility/Utils')
const moment = require('moment')

class Logs {
    static async ChannelCreate(self, channel) {

    }

    static async ChannelDelete(self, channel) {

    }

    static async ChannelUpdate(self, before, channel) {
        
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

            const log = message.guild.channels.cache.get(server.moderation.logs.types.guild_member_add.channel_id)

            const is_ok = log && message.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(message.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await message.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.guild_member_add.title) })

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

            const log = message.guild.channels.cache.get(server.moderation.types.logs.guild_member_remove.channel_id)

            const is_ok = log && message.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(message.guild.me).has('MANAGE_WEBHOOKS')

            if (is_ok) {
                const webhooks = await message.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.guild_member_remove.title) })

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
                const content = TruncateString(message.content, 800)

                const webhooks = await message.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_delete.title) })

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
                    .addField(locale.logs.message_delete.content, content)
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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_delete_bulk.title) })

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

                await self.emit('moduleExecution', { module: 'Logs: Message Delete Bulk', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
            
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
                const before_content = TruncateString(before.content, 800)
                const content = TruncateString(message.content, 800)

                const webhooks = await message.guild.fetchWebhooks()
                const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
                let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

                if (!webhook) {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_update.title) })

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
                    .addField(locale.logs.message_update.content_before_update, before_content)
                    .addField(locale.logs.message_update.content_after_update, content)
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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_connect.title) })

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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_disconnect.title) })

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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_move.title) })

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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_mute.title) })

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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_unmute.title) })

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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_deaf.title) })

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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_undeaf.title) })

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