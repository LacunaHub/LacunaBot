import { BaseGuildTextChannel, GuildMember, MessageEmbed, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import Farewell from '../../modules/Farewell'
import { GuildMemberRemove, images } from '../../modules/Logs'

const handler = async (self: Lacuna, member: GuildMember) => {
    if (member.partial) {
        member = await member.fetch().catch(() => {}) as GuildMember
    }

    if (!member || !member.guild) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    const locale = self.translator.locale(server.locale).commands

    const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

    if (case_log && member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) && server.moderation.case_log.case_types.KICK) {
        const audit = await member.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_KICK' })
        const entry = audit.entries.find(e => (e.target as User).id == member.id)

        if (entry && (entry.executor.id != self.user.id || entry.reason?.includes('Автомодер:'))) {
            const case_id = server.moderation.case_log.cases.length + 1
    
            const embed = new MessageEmbed()
                .setAuthor({ name: locale.common.case_log.cases.KICK, iconURL: images.KICK })
                .addField(locale.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
                .addField(locale.common.case_log.executor, entry.executor.tag, true)
                .addField(locale.common.case_log.reason, entry.reason ?? '-')
                .setFooter(self.translator.format(locale.common.case_log.case, case_id))
                .setTimestamp()
                .setColor('#EF5350')
            
            await case_log.send({ embeds: [embed] })
    
            await self.db.servers.updateOne({ _id: member.guild.id }, {
                $push: {
                    'moderation.case_log.cases': {
                        case_id: case_id,
                        type: 1 << 2,
                        timestamp: Date.now(),
                        reason: entry.reason ?? '-',
                        target: {
                            id: member.id,
                            name: member.user.tag
                        },
                        executor: {
                            id: entry.executor.id,
                            name: entry.executor.tag
                        }
                    }
                }
            })
        }
    }

    await Farewell(self, server, member)

    await GuildMemberRemove(self, server, member)

    if (server.modules.levels.reset_on_leave) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.activities?.levels?.some(i => i.guild_id == member.guild.id)) {
            await self.db.users.updateOne({ _id: member.id }, {
                $pull: {
                    'activities.levels': { guild_id: member.guild.id } as never
                }
            })
        }
    }

    if (server.modules.economy.reset_wallet_on_leave) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.activities?.wallets?.some(i => i.guild_id == member.guild.id)) {
            await self.db.users.updateOne({ _id: member.id }, {
                $pull: {
                    wallets: { guild_id: member.guild.id } as never
                }
            })
        }
    }

    return true
}

export default {
    name: 'guildMemberRemove',
    handler
}