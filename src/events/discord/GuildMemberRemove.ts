import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, Events, GuildMember } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import Farewell from '../../modules/Farewell'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Logs from '../../modules/Logs'
import { createCaseLogEntry } from '../../modules/Moderation/CaseLog'

const handler = async (self: Lacuna, member: GuildMember) => {
    if (!member || !member.guild) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    await self.fetchGuild(member.guild)
    await Farewell.sendMessage(self, server, member)
    await Farewell.saveNicknameAndRoles(self, server, member)
    await Automation.handleEvent('GUILD_MEMBER_REMOVE', self, server, member)

    const caseLogChannel = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel,
        botMember = member.guild.members.me

    if (caseLogChannel && botMember.permissions.has(self.PermissionFlags.ViewAuditLog) && server.moderation.case_log.types.KICK.active) {
        const audit = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick }),
            entry = audit.entries.find(v => v.targetId === member.id)

        if (entry && entry.executor.id !== self.user.id) {
            await createCaseLogEntry(member.guild, { type: 'Kick', target: member.user, executor: entry.executor, reason: entry.reason })
        }
    }

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

    await GuildImageRotation.rotateBanner(self, server, member.guild, member)
    await Logs.GuildMemberRemove(self, server, member)

    return true
}

export default {
    name: Events.GuildMemberRemove,
    handler
}
