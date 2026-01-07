import { ServerDocument } from '@/database/schemas/Servers'
import { ForumChannel, Guild, GuildMember, GuildTextBasedChannel, MediaChannel, User } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import Lacuna from '../../internals/Lacuna'
import TemporaryBan from '../../internals/structures/TemporaryBan'
import { generateSimpleId } from '../../internals/utility/Utils'
import Replacer from '../Replacer'
import { createCaseLogEntry } from './CaseLog'

async function banUser(self: Lacuna, server: ServerDocument, guild: Guild, options: ModerateUserOptionsWithDuration) {
    const { target, durationSeconds } = options,
        executor = options.executor ?? self.user
    let reason = options.reason

    if (typeof durationSeconds === 'number' && durationSeconds > 0) {
        const expiresAt = Date.now() + durationSeconds * 1000,
            durationString = moment(expiresAt).locale(server.locale).fromNow(true)
        reason = reason ? `${reason} (${durationString})` : `(${durationString})`

        new TemporaryBan(self, {
            user_id: target.id,
            guild_id: guild.id,
            expires_timestamp: expiresAt,
            reason,
            initial: true
        })
    } else {
        try {
            await guild.members.ban(target.id, { reason })
        } catch (err) {
            await self.logger.handleError({ module: 'Moderation', action: 'Ban', error: err, guild_id: guild.id })

            throw new Error(err)
        }
    }

    await createCaseLogEntry(guild, { type: 'BanAdd', target: target.user, executor, reason })

    return true
}

async function kickUser(self: Lacuna, server: ServerDocument, guild: Guild, options: ModerateUserOptions) {
    const { target, reason } = options,
        executor = options.executor ?? self.user

    try {
        await target.kick(reason)
    } catch (err) {
        await self.logger.handleError({ module: 'Moderation', action: 'Kick', error: err, guild_id: guild.id })

        throw new Error(err)
    }

    await createCaseLogEntry(guild, { type: 'Kick', target: target.user, executor, reason })

    return true
}

async function muteUser(self: Lacuna, server: ServerDocument, guild: Guild, options: ModerateUserOptionsWithDuration) {
    const { target, durationSeconds } = options,
        executor = options.executor ?? self.user
    let reason = options.reason

    let expiresAt = ms('6h')
    if (typeof durationSeconds === 'number' && durationSeconds > 0) expiresAt = Date.now() + durationSeconds * 1000

    const durationString = moment(expiresAt).locale(server.locale).fromNow(true)
    reason = reason ? `${reason} (${durationString})` : `(${durationString})`

    try {
        await target.disableCommunicationUntil(expiresAt, reason)
    } catch (err) {
        await self.logger.handleError({ module: 'Moderation', action: 'Mute', error: err, guild_id: guild.id })

        throw new Error(err)
    }

    await createCaseLogEntry(guild, { type: 'MuteAdd', target: target.user, executor, reason })
    await muteUserRemoveAllRoles(self, server, target)

    return true
}

async function muteUserRemoveAllRoles(self: Lacuna, server: ServerDocument, target: GuildMember) {
    if (!server.moderation.mutes.rar) return false

    const currentRoles = target.roles.cache.filter(v => v.editable && v.id !== server._id).map(v => v.id)
    await self.db.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'moderation.mutes.rar_data': {
                    user_id: target.id,
                    roles: currentRoles
                }
            }
        }
    )

    const strictRoles = [
        ...server.moderation.mutes.rar_strict.filter(v => currentRoles.includes(v)),
        ...target.roles.cache.filter(v => !v.editable).map(v => v.id)
    ]

    try {
        await target.roles.set(strictRoles, 'Moderation: Remove all roles')
    } catch (err) {
        await self.logger.handleError({ module: 'Moderation', action: 'MuteRemoveAllRoles', error: err, guild_id: server._id })

        throw new Error(err)
    }

    return true
}

async function warnUser(self: Lacuna, server: ServerDocument, guild: Guild, options: ModerateUserOptionsWithChannel) {
    const { target, executor, reason, channel } = options
    const dateNow = Date.now()
    const violator = server.moderation.warnings.violators.find(v => v.user_id === target.id),
        warningPenalty = server.moderation.warnings.penalties.find(v => (violator ? v.penalties == violator.violations.length + 1 : v.penalties == 1))

    if (violator) {
        await self.db.servers.updateOne(
            { _id: guild.id, 'moderation.warnings.violators.user_id': target.id },
            {
                $push: {
                    'moderation.warnings.violators.$.violations': {
                        id: generateSimpleId(5),
                        timestamp: dateNow,
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
                                timestamp: dateNow,
                                reason: reason ?? null
                            }
                        ]
                    }
                }
            }
        )
    }

    await createCaseLogEntry(guild, { type: 'WarnAdd', target: target.user, executor, reason })

    if (warningPenalty) {
        const hasBanAction = warningPenalty.options.includes('ACTION_BAN'),
            hasKickAAction = warningPenalty.options.includes('ACTION_KICK'),
            hasMuteAction = warningPenalty.options.includes('ACTION_MUTE'),
            hasModifyRolesAction = warningPenalty.options.includes('ACTION_MODIFY_ROLES'),
            hasSendMessageAction = warningPenalty.options.includes('ACTION_SEND_MESSAGE'),
            hasResetViolationsAction = warningPenalty.options.includes('ACTION_RESET_VIOLATIONS')

        if (hasBanAction && !hasKickAAction && !hasMuteAction)
            await banUser(self, server, guild, { target, executor, reason, durationSeconds: warningPenalty.ban_timeout })
        if (hasKickAAction && !hasBanAction && !hasMuteAction) await kickUser(self, server, guild, { target, executor, reason })
        if (hasMuteAction && !hasBanAction && !hasKickAAction)
            await muteUser(self, server, guild, { target, executor, reason, durationSeconds: warningPenalty.mute_timeout })

        if (hasModifyRolesAction && !hasBanAction && !hasKickAAction) {
            const addRoles = warningPenalty.modify_roles?.add ?? [],
                removeRoles = warningPenalty.modify_roles?.remove ?? []

            try {
                if (Array.isArray(addRoles) && addRoles.length) {
                    await target.roles.add(addRoles)
                }

                if (Array.isArray(removeRoles) && removeRoles.length) {
                    await target.roles.remove(removeRoles)
                }
            } catch (err) {
                await self.logger.handleError({ module: 'Moderation', action: 'WarnUserModifyRoles', error: err, guild_id: guild.id })
            }
        }

        if (hasSendMessageAction) {
            try {
                const replacer = new Replacer(server.premium.available, { guild, member: target }),
                    messagePayload = await replacer.replaceTemplateMessage(warningPenalty.send_message)

                if (channel?.isSendable()) await channel.send(messagePayload)
            } catch (err) {
                await self.logger.handleError({ module: 'DAME', action: 'SendMessage', error: err, guild_id: guild.id })
            }
        }

        if (hasResetViolationsAction) {
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
            module: 'Moderation',
            category: 'Warnings',
            guild: { id: guild.id, name: guild.name },
            target: { id: target.id, name: target.user.tag }
        })
    }

    if (server.moderation.case_log.types.WARN_ADD.active) {
        const replacer = new Replacer(server.premium.available, { guild, member: target }),
            messagePayload = await replacer.replaceTemplateMessage(server.moderation.case_log.types.WARN_ADD.dm_message, {
                penalty: { reason: reason ?? '-' }
            })

        try {
            await target.send(messagePayload)
        } catch (err) {
            await self.logger.handleError({ module: 'Warnings', action: 'SendDirectMessage', error: err, guild_id: guild.id })
        }

        self.emit('moduleExecution', {
            module: 'Moderation',
            category: 'Warnings',
            label: 'SendDirectMessage',
            guild: { id: guild.id, name: guild.name },
            target: { id: target.id, name: target.user.tag }
        })
    }

    return true
}

export default {
    banUser,
    kickUser,
    muteUser,
    muteUserRemoveAllRoles,
    warnUser
}

export interface ModerateUserOptions {
    target: GuildMember
    executor?: User
    reason?: string
}

export interface ModerateUserOptionsWithDuration extends ModerateUserOptions {
    durationSeconds?: number
}

export interface ModerateUserOptionsWithChannel extends ModerateUserOptions {
    channel: ForumChannel | MediaChannel | GuildTextBasedChannel
}
