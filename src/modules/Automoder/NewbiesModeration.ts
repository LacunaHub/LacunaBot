import { GuildMember } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import TemporaryBan from '../../internals/structures/TemporaryBan'
import { caseLog } from '../Moderation'

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember) {
    let reason = self.i18n.t(server.locale, 'audit_reasons.automoder_newbies_moderation')
    const config = server.moderation.automoder.newbies

    if (!config.active) return false

    const values = {
        MINUTES: 60,
        HOURS: 3600,
        DAYS: 86400
    }

    const is_newbie =
        (Date.now() - member.user.createdTimestamp) / 1000 < config.minimum_account_age.value * values[config.minimum_account_age.measure]

    if (is_newbie) {
        const ban = config.options.includes('ACTION_BAN')
        const kick = config.options.includes('ACTION_KICK')
        const mute = config.options.includes('ACTION_MUTE')
        const modify_roles = config.options.includes('ACTION_MODIFY_ROLES')

        if (ban && !mute && !kick && member.bannable) {
            if (config.ban_timeout) {
                const expires_timestamp = Date.now() + config.ban_timeout * 1000
                reason += ` (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`

                new TemporaryBan(self, {
                    user_id: member.id,
                    guild_id: member.guild.id,
                    expires_timestamp: expires_timestamp,
                    reason: reason,
                    initial: true
                })
            } else {
                await member.guild.members.ban(member.id, { reason }).catch(self.logger.error)
            }

            await caseLog.createCaseEntry(member.guild, { type: 'BAN_ADD', target: member.user, executor: self.user, reason })
        }

        if (mute && !ban && !kick && member.moderatable) {
            const expires_timestamp = Date.now() + (config.mute_timeout ? config.mute_timeout * 1000 : ms('2h'))
            reason += ` (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`

            await member.disableCommunicationUntil(expires_timestamp, reason).catch(() => {})
            await caseLog.createCaseEntry(member.guild, { type: 'MUTE_ADD', target: member.user, executor: self.user, reason })

            if (server.moderation.mutes.rar) {
                const current_roles = member.roles.cache.filter(r => r.editable && r.id != member.guild.id).map(r => r.id)

                await self.db.servers.updateOne(
                    { _id: member.guild.id },
                    {
                        $push: {
                            'moderation.mutes.rar_data': {
                                user_id: member.id,
                                roles: current_roles
                            }
                        }
                    }
                )

                const strict_roles = [
                    ...server.moderation.mutes.rar_strict.filter(r => current_roles.includes(r)),
                    ...member.roles.cache.filter(r => !r.editable).map(r => r.id)
                ]

                await member.roles.set(strict_roles, reason).catch(self.logger.error)
            }
        }

        if (kick && !ban && !mute && member.kickable) {
            await member.kick(reason).catch(self.logger.error)
            await caseLog.createCaseEntry(member.guild, { type: 'KICK', target: member.user, executor: self.user, reason })
        }

        if (modify_roles && !ban && !kick) {
            if (config.modify_roles?.add?.length) {
                const editable = member.guild.roles.cache.filter(r => r.editable && config.modify_roles.add.includes(r.id))

                if (editable.size) {
                    await member.roles.add(editable, reason).catch(self.logger.error)
                }
            }

            if (config.modify_roles?.remove?.length) {
                const editable = member.guild.roles.cache.filter(r => r.editable && config.modify_roles.remove.includes(r.id))

                if (editable.size) {
                    await member.roles.remove(editable, reason).catch(self.logger.error)
                }
            }
        }

        self.emit('moduleExecution', {
            module: 'AutoModer',
            category: 'NewbiesModeration',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })

        return true
    }
}
