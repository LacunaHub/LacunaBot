import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, Events, GuildBan } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'
import { createCaseLogEntry } from '../../modules/Moderation/CaseLog'

const handler = async (self: Lacuna, ban: GuildBan) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: ban.guild.id })
    const caseLogChannel = ban.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel,
        botMember = ban.guild.members.me
    let reason: string

    if (caseLogChannel && botMember.permissions.has(self.PermissionFlags.ViewAuditLog) && server.moderation.case_log.types.BAN_REMOVE.active) {
        const audit = await ban.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberBanRemove }),
            entry = audit.entries.find(v => v.targetId === ban.user.id)

        if (entry && entry.executor.id !== self.user.id) {
            reason = entry.reason
            await createCaseLogEntry(ban.guild, { type: 'BanRemove', target: ban.user, executor: entry.executor, reason: entry.reason })
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
