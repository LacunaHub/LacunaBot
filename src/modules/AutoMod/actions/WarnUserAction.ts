import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ButtonInteraction, ChatInputCommandInteraction, GuildMember, Message } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import { generateSimpleId } from '../../../internals/utility/Utils'
import { createCaseLogEntry } from '../../Moderation/CaseLog'
import Replacer from '../../Replacer'
import banAction from './BanAction'
import kickAction from './KickAction'
import modifyRolesAction from './ModifyRolesAction'
import muteAction from './MuteAction'

export default async function warnUserAction(
    self: Lacuna,
    server: ServerDocument,
    signal: Message | ChatInputCommandInteraction | ButtonInteraction,
    options: WarnUserActionOptions
) {
    const target = options.target,
        executor = options.executor,
        reason = options.reason
    const timestamp = Date.now()

    const violator = server.moderation.warnings.violators.find(v => v.user_id === target.id),
        penalty = server.moderation.warnings.penalties.find(v => (violator ? v.penalties == violator.violations.length + 1 : v.penalties == 1))

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

    await createCaseLogEntry(signal.guild, { type: 'WarnAdd', target: target.user, executor: executor.user, reason })

    if (penalty) {
        const optBan = penalty.options.includes('ACTION_BAN'),
            optKick = penalty.options.includes('ACTION_KICK'),
            optModifyRoles = penalty.options.includes('ACTION_MODIFY_ROLES'),
            optMute = penalty.options.includes('ACTION_MUTE'),
            optSendMessage = penalty.options.includes('ACTION_SEND_MESSAGE'),
            optResetViolations = penalty.options.includes('ACTION_RESET_VIOLATIONS')

        if (optBan && !optKick && !optMute) await banAction(self, server, { config: penalty, guild: signal.guild, target, reason })
        if (optKick && !optBan && !optMute) await kickAction(self, { guild: signal.guild, target, reason })
        if (optModifyRoles && !optBan && !optKick) modifyRolesAction(self, { config: penalty, guild: signal.guild, target, reason })
        if (optMute && !optBan && !optKick) await muteAction(self, server, { config: penalty, guild: signal.guild, target, reason })

        if (optSendMessage) {
            try {
                const replacer = new Replacer(server.premium.available, {
                        message: signal instanceof Message ? signal : undefined,
                        guild: signal.guild,
                        member: target
                    }),
                    messagePayload = await replacer.replaceTemplateMessage(penalty.send_message)

                await signal.channel.send(messagePayload)
            } catch (err) {
                await self.logger.handleError({ module: 'WarningPenalty', action: 'SendMessage', error: err, guild_id: signal.guildId })
            }
        }

        if (optResetViolations) {
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

        self.emit('moduleExecution', {
            module: 'Moderation',
            category: 'Warnings',
            label: 'HandlePenalty',
            guild: { id: signal.guild.id, name: signal.guild.name },
            target: { id: target.id, name: target.user.tag }
        })
    }

    if (server.moderation.case_log.types.WARN_ADD.active) {
        const replacer = new Replacer(server.premium.available, {
                guild: signal.guild,
                member: target,
                message: signal instanceof Message ? signal : undefined
            }),
            messagePayload = await replacer.replaceTemplateMessage(server.moderation.case_log.types.WARN_ADD.dm_message, {
                penalty: { reason: reason ?? '-' }
            })

        try {
            await target.send(messagePayload)
        } catch (err) {
            await self.logger.handleError({ module: 'Warnings', action: 'SendDirectMessage', error: err, guild_id: signal.guildId })
        }

        self.emit('moduleExecution', {
            module: 'Moderation',
            category: 'Warnings',
            label: 'SendDirectMessage',
            guild: { id: signal.guild.id, name: signal.guild.name },
            target: { id: target.id, name: target.user.tag }
        })
    }
}

export interface WarnUserActionOptions {
    target: GuildMember
    executor: GuildMember
    reason?: string
}
