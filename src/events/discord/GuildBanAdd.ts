import { BaseGuildTextChannel, GuildBan, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { GuildBanAdd } from '../../modules/Logs'
import { caseLog } from '../../modules/Moderation'

const handler = async (self: Lacuna, ban: GuildBan) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: ban.guild.id })

    if (!server) return false

    const case_log = ban.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

    if (case_log && ban.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) && server.moderation.case_log.case_types.BAN_ADD) {
        const audit = await ban.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_BAN_ADD' })
        const entry = audit.entries.find(e => (e.target as User).id == ban.user.id)

        if (entry && (entry.executor.id != self.user.id || entry.reason?.includes('Автомодер:'))) {
            await caseLog.createCaseEntry(server, ban.guild, { type: 'BAN_ADD', target: ban.user, executor: entry.executor, reason: entry.reason })
        }
    }

    await GuildBanAdd(self, server, ban.guild, ban.user)

    return true
}

export default {
    name: 'guildBanAdd',
    handler
}
