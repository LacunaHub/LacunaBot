import { BaseGuildTextChannel, GuildMember, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { nicknamesModeration } from '../../modules/Automoder'
import Greeting from '../../modules/Greeting'
import { GuildMemberUpdate } from '../../modules/Logs'
import { caseLog } from '../../modules/Moderation'

const handler = async (self: Lacuna, before: GuildMember, member: GuildMember) => {
    if (self.user.id == member.id) return false

    if (before.partial) {
        before = (await before.fetch().catch(() => {})) as GuildMember
    }

    if (member.partial) {
        member = (await member.fetch().catch(() => {})) as GuildMember
    }

    if (!before || !member) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.roles.cache.some(r => !before.roles.cache.has(r.id))) {
        const roles = member.roles.cache.filter(r => !before.roles.cache.has(r.id))

        self.emit('roleMemberAdd', member, roles)
    }

    if (before.roles.cache.some(r => !member.roles.cache.has(r.id))) {
        const roles = before.roles.cache.filter(r => !member.roles.cache.has(r.id))

        self.emit('roleMemberRemove', member, roles)
    }

    if (member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED') && before.pending && !member.pending) await Greeting(self, server, member)

    if (before.communicationDisabledUntilTimestamp !== member.communicationDisabledUntilTimestamp) {
        const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

        if (
            case_log &&
            member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) &&
            (server.moderation.case_log.case_types.MUTE_ADD || server.moderation.case_log.case_types.MUTE_REMOVE)
        ) {
            const audit = await member.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_UPDATE' })
            const entry = audit.entries.find(e => (e.target as User).id == member.id)

            if (entry && (entry.executor.id != self.user.id || entry.reason?.includes('Автомодер:'))) {
                await caseLog.createCaseEntry(server, member.guild, {
                    type: member.communicationDisabledUntilTimestamp ? 'MUTE_ADD' : 'MUTE_REMOVE',
                    target: member.user,
                    executor: entry.executor,
                    reason: entry.reason
                })
            }
        }
    }

    await GuildMemberUpdate(self, server, before, member)

    await nicknamesModeration(self, server, member)

    return true
}

export default {
    name: 'guildMemberUpdate',
    handler
}
