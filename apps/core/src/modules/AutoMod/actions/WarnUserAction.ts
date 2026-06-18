import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { generateSimpleId } from '@/internals/utility/Utils.js'
import { DirectMessages } from '@/modules/DirectMessages.js'
import { createCaseLogEntry } from '@/modules/Moderation/CaseLog.js'
import Replacer from '@/modules/Replacer.js'
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    type GuildTextBasedChannel,
    Message,
    User
} from 'discord.js'
import banAction from './BanAction.js'
import kickAction from './KickAction.js'
import modifyRolesAction from './ModifyRolesAction.js'
import muteAction from './MuteAction.js'

export default async function warnUserAction(
    self: Lacuna,
    server: ServerDocument,
    signal: Message<true> | ChatInputCommandInteraction | ButtonInteraction,
    options: WarnUserActionOptions
) {
    const target = options.target,
        executor = options.executor instanceof GuildMember ? options.executor.user : options.executor,
        reason = options.reason ?? '-'
    const guild = signal.guild!
    const timestamp = Date.now()

    const violator = server.moderation.warnings.violators.find(v => v.user_id === target.id),
        penalty = server.moderation.warnings.penalties.find(v =>
            violator ? v.penalties == violator.violations.length + 1 : v.penalties == 1
        )

    if (violator) {
        await self.db.servers.updateOne(
            { _id: guild.id, 'moderation.warnings.violators.user_id': target.id },
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
    } else {
        await self.db.servers.updateOne(
            { _id: guild.id },
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
    }

    await createCaseLogEntry(guild, { type: 'WarnAdd', target: target.user, executor, reason })

    if (penalty) {
        const optBan = penalty.options.includes('ACTION_BAN'),
            optKick = penalty.options.includes('ACTION_KICK'),
            optModifyRoles = penalty.options.includes('ACTION_MODIFY_ROLES'),
            optMute = penalty.options.includes('ACTION_MUTE'),
            optSendMessage = penalty.options.includes('ACTION_SEND_MESSAGE'),
            optResetViolations = penalty.options.includes('ACTION_RESET_VIOLATIONS')

        if (optBan && !optKick && !optMute) await banAction(self, server, { config: penalty, guild, target, reason })
        if (optKick && !optBan && !optMute) await kickAction(self, { guild, target, reason })
        if (optModifyRoles && !optBan && !optKick) modifyRolesAction(self, { config: penalty, guild, target, reason })
        if (optMute && !optBan && !optKick) await muteAction(self, server, { config: penalty, guild, target, reason })

        if (optSendMessage) {
            try {
                const replacer = new Replacer(server.premium.available, {
                        message: signal instanceof Message ? signal : null,
                        guild: guild,
                        member: target
                    }),
                    messagePayload = await replacer.replaceTemplateMessage(penalty.send_message!)

                await (signal.channel as GuildTextBasedChannel).send(messagePayload)
            } catch (err) {
                self.logger.error({ module: 'WarningPenalty', action: 'SendMessage', err, guildId: signal.guildId })
            }
        }

        if (optResetViolations) {
            await self.db.servers.updateOne(
                { _id: guild.id },
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
            guildId: guild.id,
            targetId: target.id,
            module: 'Moderation',
            category: 'Warnings',
            label: 'HandlePenalty'
        })
    }

    if (server.moderation.case_log.types.WARN_ADD.active) {
        const replacer = new Replacer(server.premium.available, {
                guild: guild,
                member: target,
                message: signal instanceof Message ? signal : null
            }),
            messagePayload = await replacer.replaceTemplateMessage(
                server.moderation.case_log.types.WARN_ADD.dm_message,
                {
                    penalty: { reason: reason ?? '-' }
                }
            )

        try {
            DirectMessages.send(self, target, messagePayload)
        } catch (err) {
            self.logger.error({ module: 'Warnings', action: 'SendDirectMessage', err, guildId: guild.id })
        }

        self.emit('moduleExecution', {
            guildId: guild.id,
            targetId: target.id,
            module: 'Moderation',
            category: 'Warnings',
            label: 'SendDirectMessage'
        })
    }
}

export interface WarnUserActionOptions {
    target: GuildMember
    executor: GuildMember | User
    reason?: string
}
