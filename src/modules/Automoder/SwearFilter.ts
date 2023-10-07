import { Message } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import TemporaryBan from '../../internals/structures/TemporaryBan'
import { caseLog, warnings } from '../Moderation'
import Replacer from '../Replacer'

export default async function (self: Lacuna, server: ServerDocument, message: Message) {
    let reason = self.i18n.t(server.locale, 'audit_reasons.automoder_swear_filter')
    const config = server.moderation.automoder.swear_filter

    if (!config.active) return false
    if (message.member.permissions.any(BigInt(config.ignored.permissions.reduce((x, y) => x | y, 0)), false)) return false

    if (config.ignored.channels.includes(message.channel.id)) return false
    if (message.member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    const content: string = message.content.toLowerCase()
    const split: string[] = content.split(/\s{1,}/)

    if (config.registry.some(reg => split.includes(reg.toLowerCase()))) {
        const ban = config.options.includes('ACTION_BAN')
        const kick = config.options.includes('ACTION_KICK')
        const mute = config.options.includes('ACTION_MUTE')
        const warn = config.options.includes('ACTION_WARN')
        const modify_roles = config.options.includes('ACTION_MODIFY_ROLES')
        const send_message = config.options.includes('ACTION_SEND_MESSAGE')
        const delete_message = config.options.includes('ACTION_DELETE_MESSAGE')

        if (ban && !mute && !kick && message.member.bannable) {
            if (config.ban_timeout) {
                const expires_timestamp = Date.now() + config.ban_timeout * 1000
                reason += ` (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`

                new TemporaryBan(self, {
                    user_id: message.author.id,
                    guild_id: message.guild.id,
                    expires_timestamp: expires_timestamp,
                    reason: reason,
                    initial: true
                })
            } else {
                try {
                    await message.guild.members.ban(message.author.id, { reason })
                } catch (err) {
                    await self.logger.handleError({ module: 'SwearFilter', action: 'Ban', error: err, guild_id: message.guildId })
                }
            }

            await caseLog.createCaseEntry(message.guild, { type: 'BAN_ADD', target: message.author, executor: self.user, reason })
        }

        if (mute && !ban && !kick && message.member.moderatable) {
            const expires_timestamp = Date.now() + (config.mute_timeout ? config.mute_timeout * 1000 : ms('2h'))
            reason += ` (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`

            try {
                await message.member.disableCommunicationUntil(expires_timestamp, reason)
            } catch (err) {
                await self.logger.handleError({ module: 'SwearFilter', action: 'DisableCommunication', error: err, guild_id: message.guildId })
            }

            await caseLog.createCaseEntry(message.guild, { type: 'MUTE_ADD', target: message.author, executor: self.user, reason })

            if (server.moderation.mutes.rar) {
                const current_roles = message.member.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)

                await self.db.servers.updateOne(
                    { _id: message.guild.id },
                    {
                        $push: {
                            'moderation.mutes.rar_data': {
                                user_id: message.author.id,
                                roles: current_roles
                            }
                        }
                    }
                )

                const strict_roles = [
                    ...server.moderation.mutes.rar_strict.filter(r => current_roles.includes(r)),
                    ...message.member.roles.cache.filter(r => !r.editable).map(r => r.id)
                ]

                try {
                    await message.member.roles.set(strict_roles, reason)
                } catch (err) {
                    await self.logger.handleError({ module: 'SwearFilter', action: 'RemoveAllRoles', error: err, guild_id: message.guildId })
                }
            }
        }

        if (kick && !ban && !mute && message.member.kickable) {
            try {
                await message.member.kick(reason)
            } catch (err) {
                await self.logger.handleError({ module: 'SwearFilter', action: 'Kick', error: err, guild_id: message.guildId })
            }

            await caseLog.createCaseEntry(message.guild, { type: 'KICK', target: message.author, executor: self.user, reason })
        }

        if (modify_roles && !ban && !kick) {
            if (config.modify_roles?.add?.length) {
                const editable = message.guild.roles.cache.filter(r => r.editable && config.modify_roles.add.includes(r.id))

                if (editable.size) {
                    try {
                        await message.member.roles.add(editable, reason)
                    } catch (err) {
                        await self.logger.handleError({ module: 'SwearFilter', action: 'ModifyRolesAdd', error: err, guild_id: message.guildId })
                    }
                }
            }

            if (config.modify_roles?.remove?.length) {
                const editable = message.guild.roles.cache.filter(r => r.editable && config.modify_roles.remove.includes(r.id))

                if (editable.size) {
                    try {
                        await message.member.roles.remove(editable, reason)
                    } catch (err) {
                        await self.logger.handleError({ module: 'SwearFilter', action: 'ModifyRolesRemove', error: err, guild_id: message.guildId })
                    }
                }
            }
        }

        if (warn) {
            await warnings.addWarn(self, server, message, { target: message.member, executor: message.guild.members.me, reason })
        }

        if (send_message && (config.send_message.content || config.send_message.embed.active)) {
            const replacer = new Replacer({ message: message, guild: message.guild, member: message.member }),
                messagePayload = await replacer.replaceTemplateMessage(config.send_message)

            try {
                await message.channel.send(messagePayload)
            } catch (err) {
                await self.logger.handleError({ module: 'SwearFilter', action: 'SendMessage', error: err, guild_id: message.guildId })
            }
        }

        if (delete_message) {
            if (message.deletable) {
                try {
                    await message.delete()
                } catch (err) {
                    await self.logger.handleError({ module: 'SwearFilter', action: 'DeleteMessage', error: err, guild_id: message.guildId })
                }
            }
        }

        self.emit('moduleExecution', {
            module: 'AutoModer',
            category: 'SwearFilter',
            guild: { id: message.guild.id, name: message.guild.name },
            target: { id: message.author.id, name: message.author.tag }
        })

        return true
    }
}
