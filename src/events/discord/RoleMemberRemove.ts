import { BaseGuildTextChannel, Collection, GuildMember, Role, User } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import TemporaryMute from '../../internals/structures/TemporaryMute'
import { RoleMemberRemove } from '../../modules/Logs'
import { caseLog } from '../../modules/Moderation'

const handler = async (self: Lacuna, member: GuildMember, roles: Collection<string, Role>) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const mute_role: Role = member.guild.roles.cache.get(server.moderation.roles.mute)

    const tempmute: TemporaryMute = self.tempmutes.get(`${member.guild.id}:${member.id}`)

    if (tempmute && mute_role && roles.has(mute_role.id)) await tempmute.delete(false)

    if (
        case_log &&
        mute_role &&
        roles.has(mute_role.id) &&
        member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) &&
        server.moderation.case_log.case_types.MUTE_REMOVE
    ) {
        const audit = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_ROLE_UPDATE' })
        const entry = audit.entries.find(e => (e.target as User).id == member.id)

        if (entry && entry.executor.id != self.user.id) {
            const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == member.id)

            if (returnable_roles) {
                await self.db.servers.updateOne(
                    { _id: member.guild.id },
                    {
                        $pull: {
                            'moderation.roles.on_mute.returnable_roles': {
                                user_id: member.id
                            }
                        }
                    }
                )

                await member.roles.add(returnable_roles.roles.filter(r => member.guild.roles.cache.has(r)))
            }

            await caseLog.createCaseEntry(server, member.guild, { type: 'MUTE_REMOVE', target: member.user, executor: entry.executor, reason: entry.reason })
        }
    }

    await RoleMemberRemove(self, server, member, roles)

    return true
}

export default {
    name: 'roleMemberRemove',
    handler
}
