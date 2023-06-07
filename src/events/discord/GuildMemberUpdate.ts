import { AuditLogEvent, BaseGuildTextChannel, Events, GuildMember, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { nicknamesModeration } from '../../modules/Automoder'
import Greeting from '../../modules/Greeting'
import { GuildMemberUpdate } from '../../modules/Logs'
import { caseLog } from '../../modules/Moderation'

const handler = async (self: Lacuna, before: GuildMember, member: GuildMember) => {
    if (self.user.id === member.id) return false

    if (member.partial) {
        try {
            member = await member.fetch()
        } catch (err) {}
    }

    if (!before || !member) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    if ('roles' in before) {
        if (member.roles.cache.some(r => !before.roles.cache.has(r.id))) {
            const roles = member.roles.cache.filter(r => !before.roles.cache.has(r.id))

            self.emit('roleMemberAdd', member, roles)
        }

        if (before.roles.cache.some(r => !member.roles.cache.has(r.id))) {
            const roles = before.roles.cache.filter(r => !member.roles.cache.has(r.id))

            self.emit('roleMemberRemove', member, roles)
        }
    }

    if (member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED') && before.pending && !member.pending) {
        await Greeting(self, server, member)
    }

    if (before.communicationDisabledUntilTimestamp !== member.communicationDisabledUntilTimestamp) {
        const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

        if (
            case_log &&
            member.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog) &&
            (server.moderation.case_log.types.MUTE_ADD.active || server.moderation.case_log.types.MUTE_REMOVE.active)
        ) {
            const audit = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberUpdate })
            const entry = audit.entries.find(e => (e.target as User).id == member.id)

            if (entry && entry.executor.id !== self.user.id) {
                await caseLog.createCaseEntry(member.guild, {
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
    name: Events.GuildMemberUpdate,
    handler
}
