import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, Events, GuildBan } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'
import { caseLog } from '../../modules/Moderation'

const handler = async (self: Lacuna, ban: GuildBan) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: ban.guild.id })

    if (!server) return false

    const caseLogChannel = ban.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel,
        botMember = ban.guild.members.me

    if (caseLogChannel && botMember.permissions.has(self.PermissionFlags.ViewAuditLog) && server.moderation.case_log.types.BAN_ADD.active) {
        const audit = await ban.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberBanAdd }),
            entry = audit.entries.find(v => v.targetId === ban.user.id)

        if (entry && entry.executor.id !== self.user.id) {
            await caseLog.createCaseEntry(ban.guild, { type: 'BanAdd', target: ban.user, executor: entry.executor, reason: entry.reason })
        }
    }

    await Logs.GuildBanAdd(self, server, ban.guild, ban.user)

    return true
}

export default {
    name: Events.GuildBanAdd,
    handler
}
