import { AuditLogEvent, BaseGuildTextChannel, GuildMember, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import Farewell from '../../modules/Farewell'
import { GuildMemberRemove } from '../../modules/Logs'
import { caseLog } from '../../modules/Moderation'

const handler = async (self: Lacuna, member: GuildMember) => {
    if (member.partial) {
        member = (await member.fetch().catch(() => {})) as GuildMember
    }

    if (!member || !member.guild) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

    if (case_log && member.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog) && server.moderation.case_log.types.KICK.active) {
        const audit = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick })
        const entry = audit.entries.find(e => (e.target as User).id == member.id)

        if (entry && entry.executor.id !== self.user.id) {
            await caseLog.createCaseEntry(member.guild, { type: 'KICK', target: member.user, executor: entry.executor, reason: entry.reason })
        }
    }

    await Farewell(self, server, member)

    await GuildMemberRemove(self, server, member)

    if (server.modules.levels.reset_on_leave) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.activities?.levels?.some(i => i.guild_id == member.guild.id)) {
            await self.db.users.updateOne(
                { _id: member.id },
                {
                    $pull: {
                        'activities.levels': { guild_id: member.guild.id } as never
                    }
                }
            )
        }
    }

    if (server.modules.economy.reset_wallet_on_leave) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.activities?.wallets?.some(i => i.guild_id == member.guild.id)) {
            await self.db.users.updateOne(
                { _id: member.id },
                {
                    $pull: {
                        wallets: { guild_id: member.guild.id } as never
                    }
                }
            )
        }
    }

    return true
}

export default {
    name: 'guildMemberRemove',
    handler
}
