import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, Events, GuildMember } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import AutoMod from '../../modules/AutoMod'
import Greeting from '../../modules/Greeting'
import Logs from '../../modules/Logs'
import { createCaseLogEntry } from '../../modules/Moderation/CaseLog'

const handler = async (self: Lacuna, before: GuildMember, member: GuildMember) => {
    if (self.user.id === member.id) return false
    if (!before || !member) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })
    const isRolesAdded = !before.partial && !member.partial && member.roles.cache.some(v => !before.roles.cache.has(v.id)),
        isRolesRemoved = !before.partial && !member.partial && before.roles.cache.some(v => !member.roles.cache.has(v.id))

    if (isRolesAdded) {
        const addedRoles = member.roles.cache.filter(v => !before.roles.cache.has(v.id))
        self.emit('roleMemberAdd', member, addedRoles)
    }

    if (isRolesRemoved) {
        const removedRoles = before.roles.cache.filter(v => !member.roles.cache.has(v.id))
        self.emit('roleMemberRemove', member, removedRoles)
    }

    if (member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED') && before.pending && !member.pending) {
        await Greeting.addInitialRoles(self, server, member)
        await Greeting.restoreNicknameAndRoles(self, server, member)
    }

    await AutoMod.moderateNicknames(self, server, member)

    if (before.communicationDisabledUntilTimestamp !== member.communicationDisabledUntilTimestamp) {
        const caseLogChannel = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel,
            botMember = member.guild.members.me

        if (
            caseLogChannel &&
            botMember.permissions.has(self.PermissionFlags.ViewAuditLog) &&
            (server.moderation.case_log.types.MUTE_ADD.active || server.moderation.case_log.types.MUTE_REMOVE.active)
        ) {
            const audit = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberUpdate }),
                entry = audit.entries.find(v => v.targetId === member.id)

            if (entry && entry.executor.id !== self.user.id) {
                await createCaseLogEntry(member.guild, {
                    type: member.communicationDisabledUntilTimestamp ? 'MuteAdd' : 'MuteRemove',
                    target: member.user,
                    executor: entry.executor,
                    reason: entry.reason
                })
            }
        }
    }

    await Logs.GuildMemberUpdate(self, server, before, member)

    return true
}

export default {
    name: Events.GuildMemberUpdate,
    handler
}
