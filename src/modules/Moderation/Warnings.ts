import { ButtonInteraction, CommandInteraction, GuildMember, Message } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument, WarningsPenalty, WarningsViolator } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import TemporaryBan from '../../internals/structures/TemporaryBan'
import TemporaryMute from '../../internals/structures/TemporaryMute'
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

    if (penalty) {
        const ban = (penalty.action & (1 << 0)) === 1 << 0
        const mute = (penalty.action & (1 << 1)) === 1 << 1
        const kick = (penalty.action & (1 << 2)) === 1 << 2
        const send_message = (penalty.action & (1 << 3)) === 1 << 3
        const edit_roles = (penalty.action & (1 << 4)) === 1 << 4
        const reset_violations = (penalty.action & (1 << 7)) === 1 << 7

        if (ban && !mute && !kick) {
            if (penalty.duration) {
                const expires_timestamp = Date.now() + penalty.duration * 1000

                new TemporaryBan(self, {
                    user_id: target.user.id,
                    guild_id: signal.guild.id,
                    expires_timestamp: expires_timestamp,
                    reason: `Автомодер: Предупреждение (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`,
                    initial: true
                })
            } else {
                await signal.guild.members.ban(target.user.id, { reason: 'Автомодер: Предупреждение' }).catch(self.logger.error)
            }
        }

        if (mute && !ban && !kick) {
            if (server.moderation.use_timeout_mute) {
                let duration = penalty.duration * 1000

                if (duration < ms('1m')) duration = ms('1m')
                else if (duration > ms('28d')) duration = ms('28d')

                await target
                    .disableCommunicationUntil(
                        Date.now() + duration,
                        `Автомодер: Предупреждение (${moment(Date.now() + duration)
                            .locale(server.locale)
                            .fromNow(true)})`
                    )
                    .catch(() => {})
            } else {
                const mute_role = signal.guild.roles.cache.get(server.moderation.roles.mute)
                const tempmute = self.tempmutes.find(tm => tm.user_id == target.user.id)

                if (mute_role && !tempmute && !mute_role.members.has(target.user.id)) {
                    if (penalty.duration) {
                        const expires_timestamp = Date.now() + penalty.duration * 1000

                        new TemporaryMute(self, {
                            user_id: target.user.id,
                            guild_id: signal.guild.id,
                            role_id: mute_role.id,
                            expires_timestamp: expires_timestamp,
                            reason: `Автомодер: Предупреждение (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`,
                            initial: true
                        })
                    } else {
                        if (server.moderation.roles.on_mute.remove_all_roles) {
                            const current_roles: string[] = target.roles.cache.filter(r => r.editable && r.id != signal.guild.id).map(r => r.id)

                            await self.db.servers.updateOne(
                                { _id: signal.guild.id },
                                {
                                    $push: {
                                        'moderation.roles.on_mute.returnable_roles': {
                                            user_id: target.id,
                                            roles: current_roles
                                        }
                                    }
                                }
                            )

                            const strict_roles: string[] = [
                                ...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)),
                                ...target.roles.cache.filter(r => !r.editable).map(r => r.id)
                            ]

                            await target.roles.set([mute_role.id, ...strict_roles], reason).catch(self.logger.error)
                        } else {
                            await target.roles.add(mute_role.id, 'Автомодер: Предупреждение').catch(self.logger.error)
                        }
                    }
                }
            }
        }

        if (kick && !ban && !mute) {
            if (target.kickable) await target.kick('Автомодер: Предупреждение')
        }

        if (edit_roles && !ban && !kick) {
            if (penalty?.add_roles?.length) {
                const editable = signal.guild.roles.cache.filter(r => r.editable && penalty.add_roles.includes(r.id))

                if (editable.size) {
                    await target.roles.add(editable, 'Автомодер: Предупреждение').catch(self.logger.error)
                }
            }

            if (penalty?.remove_roles?.length) {
                const editable = signal.guild.roles.cache.filter(r => r.editable && penalty.remove_roles.includes(r.id))

                if (editable.size) {
                    await target.roles.remove(editable, 'Автомодер: Предупреждение').catch(self.logger.error)
                }
            }
        }

        if (send_message) {
            const replacer = new Replacer(null, { message: signal instanceof Message ? signal : undefined, guild: signal.guild, member: target })
            const content = await replacer.replaceTemplateMessage(penalty.message)

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

    if (server.moderation.case_log.case_types_messages.WARN_ADD.active) {
        const replacer = new Replacer(null, { guild: signal.guild, member: target, message: signal instanceof Message ? signal : undefined, penalty: { reason: reason ?? '-' } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.case_types_messages.WARN_ADD.dm_message)

        await target.send(dm_message).catch(self.logger.error)
    }

    await caseLog.createCaseEntry(server, signal.guild, { type: 'WARN_ADD', target: target.user, executor: executor.user, reason })
}

export interface WarnOptions {
    target: GuildMember
    executor: GuildMember
    reason?: string
}
