import {
    ServerDocument,
    ServerModerationAutoModAntiCaps,
    ServerModerationAutoModLinksFilter,
    ServerModerationAutoModNewbies,
    ServerModerationAutoModSwearFilter,
    ServerModerationAutoModUsersSlowdown,
    ServerModerationWarningsPenalty
} from '@/database/schemas/Servers'
import { Guild, GuildMember } from 'discord.js'
import moment from 'moment'
import Lacuna from '../../../internals/Lacuna'
import TemporaryBan from '../../../internals/structures/TemporaryBan'
import { createCaseLogEntry } from '../../Moderation/CaseLog'

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
            await self.logger.handleError({ module: 'AutoMod', action: 'Ban', error: err, guild_id: guild.id })
        }
    }

    await createCaseLogEntry(guild, { type: 'BanAdd', target: target.user, executor: self.user, reason })
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
