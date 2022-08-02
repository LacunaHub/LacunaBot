import { ButtonInteraction, CommandInteraction, GuildMember, Message } from 'discord.js'
import ms from 'ms'
import { ServerDocument, WarningsPenalty, WarningsViolator } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import TemporaryBan from '../../internals/structures/TemporaryBan'
import { generateSimpleId } from '../../internals/utility/UID'
import { caseLog } from './'
import Replacer from './../Replacer'

export async function addWarn(self: Lacuna, server: ServerDocument, signal: Message | CommandInteraction | ButtonInteraction, options: WarnOptions) {
    const target = options.target,
        executor = options.executor,
        reason = options.reason
    const timestamp: number = Date.now()

    const violator: WarningsViolator = server.moderation.warnings.violators.find(v => v.user_id == target.id)
    const penalty: WarningsPenalty = server.moderation.warnings.penalties.find(p => (violator ? p.penalties == violator.violations.length + 1 : p.penalties == 1))

    if (!violator) {
        await self.db.servers.updateOne(
            { _id: signal.guild.id },
            {
                $push: {
                    'moderation.warnings.violators': {
                        user_id: target.id,
                        violations: [
                            {
                                id: generateSimpleId(5),
                                timestamp: timestamp,
                                reason: reason ?? null
                            }
                        ]
                    }
                }
            }
        )
    } else {
        await self.db.servers.updateOne(
            { _id: signal.guild.id, 'moderation.warnings.violators.user_id': target.id },
            {
                $push: {
                    'moderation.warnings.violators.$.violations': {
                        id: generateSimpleId(5),
                        timestamp: timestamp,
                        reason: reason ?? null
                    }
                }
            }
        )
    }

    await caseLog.createCaseEntry(signal.guild, { type: 'WARN_ADD', target: target.user, executor: executor.user, reason })

    if (penalty) {
        const ban = penalty.options.includes('ACTION_BAN')
        const mute = penalty.options.includes('ACTION_MUTE')
        const kick = penalty.options.includes('ACTION_KICK')
        const send_message = penalty.options.includes('ACTION_SEND_MESSAGE')
        const modify_roles = penalty.options.includes('ACTION_MODIFY_ROLES')
        const reset_violations = penalty.options.includes('ACTION_RESET_VIOLATIONS')

        if (ban && !mute && !kick && target.bannable) {
            if (penalty.ban_timeout) {
                const expires_timestamp = Date.now() + penalty.ban_timeout * 1000

                new TemporaryBan(self, {
                    user_id: target.user.id,
                    guild_id: signal.guild.id,
                    expires_timestamp: expires_timestamp,
                    reason: reason,
                    initial: true
                })
            } else {
                await signal.guild.members.ban(target.user.id, { reason }).catch(self.logger.error)
            }

            await caseLog.createCaseEntry(signal.guild, { type: 'BAN_ADD', target: target.user, executor: self.user, reason })
        }

        if (mute && !ban && !kick && target.moderatable) {
            let duration = penalty.mute_timeout * 1000

            if (duration < ms('1m')) duration = ms('1m')
            else if (duration > ms('28d')) duration = ms('28d')

            await target.disableCommunicationUntil(Date.now() + duration, reason).catch(() => {})
            await caseLog.createCaseEntry(signal.guild, { type: 'MUTE_ADD', target: target.user, executor: self.user, reason })

            if (server.moderation.mutes.rar) {
                const current_roles = target.roles.cache.filter(r => r.editable && r.id != signal.guild.id).map(r => r.id)

                await self.db.servers.updateOne(
                    { _id: signal.guild.id },
                    {
                        $push: {
                            'moderation.mutes.rar_data': {
                                user_id: target.id,
                                roles: current_roles
                            }
                        }
                    }
                )

                const strict_roles = [
                    ...server.moderation.mutes.rar_strict.filter(r => current_roles.includes(r)),
                    ...target.roles.cache.filter(r => !r.editable).map(r => r.id)
                ]

                await target.roles.set(strict_roles, reason).catch(self.logger.error)
            }
        }

        if (kick && !ban && !mute && target.kickable) {
            await target.kick(reason).catch(() => {})
            await caseLog.createCaseEntry(signal.guild, { type: 'KICK', target: target.user, executor: self.user, reason })
        }

        if (modify_roles && !ban && !kick) {
            if (penalty?.modify_roles?.add?.length) {
                const editable = signal.guild.roles.cache.filter(r => r.editable && penalty.modify_roles.add.includes(r.id))

                if (editable.size) {
                    await target.roles.add(editable, reason).catch(self.logger.error)
                }
            }

            if (penalty?.modify_roles?.remove?.length) {
                const editable = signal.guild.roles.cache.filter(r => r.editable && penalty.modify_roles.remove.includes(r.id))

                if (editable.size) {
                    await target.roles.remove(editable, reason).catch(self.logger.error)
                }
            }
        }

        if (send_message) {
            const replacer = new Replacer(null, { message: signal instanceof Message ? signal : undefined, guild: signal.guild, member: target })
            const content = await replacer.replaceTemplateMessage(penalty.send_message)

            await signal.channel.send(content).catch(self.logger.error)
        }

        if (reset_violations) {
            await self.db.servers.updateOne(
                { _id: signal.guild.id },
                {
                    $pull: {
                        'moderation.warnings.violators': {
                            user_id: target.id
                        }
                    }
                }
            )
        }
    }

    if (server.moderation.case_log.types.WARN_ADD.active) {
        const replacer = new Replacer(null, {
            guild: signal.guild,
            member: target,
            message: signal instanceof Message ? signal : undefined,
            penalty: { reason: reason ?? '-' }
        })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.types.WARN_ADD.dm_message)

        await target.send(dm_message).catch(self.logger.error)
    }
}

export interface WarnOptions {
    target: GuildMember
    executor: GuildMember
    reason?: string
}
