import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, Events, GuildBan, User } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'
import { caseLog } from '../../modules/Moderation'

const handler = async (self: Lacuna, ban: GuildBan) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: ban.guild.id })
    const case_log = ban.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    let reason: string

    if (case_log && ban.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog) && server.moderation.case_log.types.BAN_REMOVE.active) {
        const audit = await ban.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberBanRemove })
        const entry = audit.entries.find(e => (e.target as User).id == ban.user.id)

        if (entry && entry.executor.id !== self.user.id) {
            reason = entry.reason
            await caseLog.createCaseEntry(ban.guild, { type: 'BAN_REMOVE', target: ban.user, executor: entry.executor, reason: entry.reason })
        }
    }

    const tempBan = self.tempbans.get(`${ban.guild.id}:${ban.user.id}`)

    if (tempBan) {
        await tempBan.delete(false, reason)
    }

    await Logs.GuildBanRemove(self, server, ban.guild, ban.user)

    return true
}

export default {
    name: Events.GuildBanRemove,
    handler
}
