import { BaseGuildTextChannel, GuildBan, MessageEmbed, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { GuildBanAdd, images } from '../../modules/Logs'

const handler = async (self: Lacuna, ban: GuildBan) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: ban.guild.id })

    if (!server) return false

    const locale = self.translator.locale(server.locale)

    const case_log = ban.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

    if (case_log && ban.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) && server.moderation.case_log.case_types.BAN_ADD) {
        const audit = await ban.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_BAN_ADD' })
        const entry = audit.entries.find(e => (e.target as User).id == ban.user.id)

        if (entry && (entry.executor.id != self.user.id || entry.reason?.includes('Автомодер:'))) {
            const case_id: number = server.moderation.case_log.cases.length + 1
    
            const embed = new MessageEmbed()
                .setAuthor({ name: locale.commands.common.case_log.cases.BAN_ADD, iconURL: images.BAN_ADD })
                .addField(locale.commands.common.case_log.target, `${ban.user.tag}\n(${ban.user.id})`, true)
                .addField(locale.commands.common.case_log.executor, entry.executor.tag, true)
                .addField(locale.commands.common.case_log.reason, entry.reason ?? '-')
                .setFooter(self.translator.format(locale.commands.common.case_log.case, case_id))
                .setTimestamp()
                .setColor('#EF5350')
            
            await case_log.send({ embeds: [embed] })
    
            await self.db.servers.updateOne({ _id: ban.guild.id }, {
                $push: {
                    'moderation.case_log.cases': {
                        case_id: case_id,
                        type: 1 << 0,
                        timestamp: Date.now(),
                        reason: entry.reason ?? '-',
                        target: {
                            id: ban.user.id,
                            name: ban.user.tag
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

    await GuildBanAdd(self, server, ban.guild, ban.user)

    return true
}

export default {
    name: 'guildBanAdd',
    handler
}