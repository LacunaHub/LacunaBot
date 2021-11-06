const { MessageEmbed } = require('discord.js')
const { GuildBanRemove, images } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildBan} ban
 */
const handler = async (self, ban) => {
    const server = await self.db.servers.fetch({ _id: ban.guild.id })

    const locale = self.translator.locale(server.locale)

    const case_log = ban.guild.channels.cache.get(server.moderation.case_log.channel_id)

    if (case_log && ban.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) && server.moderation.case_log.case_types.BAN_REMOVE) {
        const audit = await ban.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_BAN_REMOVE' })
        const entry = audit.entries.find(e => e.target.id == ban.user.id)

        if (entry && entry.executor.id != self.user.id) {
            const case_id = server.moderation.case_log.cases.length + 1
    
            const embed = new MessageEmbed()
                .setAuthor(locale.commands.common.case_log.cases.BAN_REMOVE, images.BAN_REMOVE)
                .addField(locale.commands.common.case_log.target, `${ban.user.tag}\n(${ban.user.id})`, true)
                .addField(locale.commands.common.case_log.executor, entry.executor.tag, true)
                .addField(locale.commands.common.case_log.reason, entry.reason ?? '')
                .setFooter(self.translator.format(locale.commands.common.case_log.case, case_id))
                .setTimestamp()
                .setColor('#2FDF84')
            
            await case_log.send({ embeds: [embed] })
    
            await self.db.servers.update({ _id: ban.guild.id }, {
                $push: {
                    'moderation.case_log.cases': {
                        case_id: case_id,
                        type: 1 << 1,
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

    const tempban = self.tempbans.get(`${ban.guild.id}:${ban.user.id}`)
    
    if (tempban) await tempban.delete()

    await GuildBanRemove(self, server, ban.guild, ban.user)

    return true
}

module.exports = {
    name: 'guildBanRemove',
    handler
}