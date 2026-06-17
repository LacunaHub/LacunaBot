import {
    type ServerDocument,
    type ServerModerationAutoModAntiCaps,
    type ServerModerationAutoModLinksFilter,
    type ServerModerationAutoModNewbies,
    type ServerModerationAutoModSwearFilter,
    type ServerModerationAutoModUsersSlowdown,
    type ServerModerationWarningsPenalty
} from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import TemporaryBan from '@/internals/structures/TemporaryBan.js'
import { createCaseLogEntry } from '@/modules/Moderation/CaseLog.js'
import { Guild, GuildMember } from 'discord.js'
import moment from 'moment'

export default async function banAction(self: Lacuna, server: ServerDocument, options: ActionOptions) {
    const { config, guild, target } = options
    let { reason } = options

    if (config.ban_timeout) {
        const expiresAt = Date.now() + config.ban_timeout * 1000
        reason += ` (${moment(expiresAt).locale(server.locale).fromNow(true)})`

        new TemporaryBan(self, {
            user_id: target.id,
            guild_id: guild.id,
            expires_timestamp: expiresAt,
            reason: reason,
            initial: true
        })
    } else {
        try {
            await guild.members.ban(target.id, { reason })
        } catch (err) {
            self.logger.error({ module: 'AutoMod', action: 'Ban', err, guildId: guild.id })
        }
    }

    await createCaseLogEntry(guild, { type: 'BanAdd', target: target.user, executor: self.user as any, reason })
}

export interface ActionOptions {
    config:
        | ServerModerationAutoModAntiCaps
        | ServerModerationAutoModLinksFilter
        | ServerModerationAutoModNewbies
        | ServerModerationAutoModSwearFilter
        | ServerModerationAutoModUsersSlowdown
        | ServerModerationWarningsPenalty
    guild: Guild
    target: GuildMember
    reason: string
}
