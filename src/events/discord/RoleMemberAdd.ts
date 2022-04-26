import { BaseGuildTextChannel, Collection, GuildMember, Role, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { RoleMemberAdd } from '../../modules/Logs'
import { caseLog } from '../../modules/Moderation'

const handler = async (self: Lacuna, member: GuildMember, roles: Collection<string, Role>) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const mute_role: Role = member.guild.roles.cache.get(server.moderation.roles.mute)

    if (
        case_log &&
        mute_role &&
        roles.has(mute_role.id) &&
        member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) &&
        server.moderation.case_log.case_types.MUTE_ADD
    ) {
        const audit = await member.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_ROLE_UPDATE' })
        const entry = audit.entries.find(e => (e.target as User).id == member.id)

        if (entry && (entry.executor.id != self.user.id || entry.reason?.includes('Автомодер:'))) {
            await caseLog.createCaseEntry(server, member.guild, { type: 'MUTE_ADD', target: member.user, executor: entry.executor, reason: entry.reason })
        }
    }

    await RoleMemberAdd(self, server, member, roles)

    return true
}

export default {
    name: 'roleMemberAdd',
    handler
}
