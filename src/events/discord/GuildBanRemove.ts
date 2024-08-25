import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, Events, GuildAuditLogsEntry, GuildBan } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'
import { createCaseLogEntry } from '../../modules/Moderation/CaseLog'

const handler = async (self: Lacuna, ban: GuildBan) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: ban.guild.id })
    const hasViewAuditLog = ban.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
    let auditLogsEntry: GuildAuditLogsEntry<AuditLogEvent.MemberBanRemove, 'Create', 'User', AuditLogEvent.MemberBanRemove>

    if (hasViewAuditLog) {
        const auditLogs = await ban.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberBanRemove })
        auditLogsEntry = auditLogs.entries.find(v => v.targetId === ban.user.id)
    }

    const caseLogChannel = ban.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    if (caseLogChannel && server.moderation.case_log.types.BAN_REMOVE.active && auditLogsEntry && auditLogsEntry.executor.id !== self.user.id) {
        await createCaseLogEntry(ban.guild, { type: 'BanRemove', target: ban.user, executor: auditLogsEntry.executor, reason: auditLogsEntry.reason })
    }

    const tempBan = self.tempbans.get(`${ban.guild.id}:${ban.user.id}`)
    if (tempBan) {
        await tempBan.delete(false, auditLogsEntry?.reason)
    }

    await self.db.serverBans.updateMany({ guild_id: ban.guild.id, user_id: ban.user.id }, { $set: { removed_at: Date.now() } })
    await Logs.GuildBanRemove(self, server, ban, auditLogsEntry)

    return true
}

export default {
    name: Events.GuildBanRemove,
    handler
}
