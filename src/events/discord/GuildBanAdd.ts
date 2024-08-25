import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, Events, GuildAuditLogsEntry, GuildBan } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'
import { createCaseLogEntry } from '../../modules/Moderation/CaseLog'

const handler = async (self: Lacuna, ban: GuildBan) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: ban.guild.id })
    if (!server) return false

    const hasViewAuditLog = ban.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
    let auditLogsEntry: GuildAuditLogsEntry<AuditLogEvent.MemberBanAdd, 'Delete', 'User', AuditLogEvent.MemberBanAdd>

    if (hasViewAuditLog) {
        const auditLogs = await ban.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberBanAdd })
        auditLogsEntry = auditLogs.entries.find(v => v.targetId === ban.user.id)
        ban.reason = auditLogsEntry?.reason ?? ban.reason ?? null
    }

    const caseLogChannel = ban.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    if (caseLogChannel && server.moderation.case_log.types.BAN_ADD.active && auditLogsEntry && auditLogsEntry.executor.id !== self.user.id) {
        await createCaseLogEntry(ban.guild, { type: 'BanAdd', target: ban.user, executor: auditLogsEntry.executor, reason: ban.reason })
    }

    await self.db.serverBans.create({
        guild_id: ban.guild.id,
        user_id: ban.user.id,
        reason: ban.reason || null
    })

    await Logs.GuildBanAdd(self, server, ban, auditLogsEntry)

    return true
}

export default {
    name: Events.GuildBanAdd,
    handler
}
