const { MessageEmbed } = require('discord.js')
const { images } = require('../../modules/Logs')
const GuildBanRemove = require('../../modules/Logs/Guild/GuildBanRemove')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').User} user
 */
const execute = async (self, guild, user) => {
    const server = await self.db.servers.fetch({ _id: guild.id })

    const locale = self.translator.locale(server.locale)

    const case_log = guild.channels.cache.get(server.moderation.case_log.channel_id)

    if (case_log && guild.me.hasPermission('VIEW_AUDIT_LOG') && server.moderation.case_log.case_types.BAN_REMOVE) {
        const audit = await guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_REMOVE' })
        const entry = audit.entries.find(e => e.target.id == user.id)

        if (entry) {
            if (entry.executor.id == self.user.id) return false

            const case_id = server.moderation.case_log.cases.length + 1
    
            const embed = new MessageEmbed()
                .setAuthor(locale.commands.common.case_log.cases.BAN_REMOVE, images.BAN_REMOVE)
                .addField(locale.commands.common.case_log.target, `${user.tag}\n(${user.id})`, true)
                .addField(locale.commands.common.case_log.executor, entry.executor.tag, true)
                .addField(locale.commands.common.case_log.reason, entry.reason || locale.commands.common.texts.none)
                .setFooter(self.translator.format(locale.commands.common.case_log.case, case_id))
                .setTimestamp()
                .setColor('#2FDF84')
            
            await case_log.send(embed)
    
            await self.db.servers.update({ _id: guild.id }, {
                $push: {
                    'moderation.case_log.cases': {
                        case_id: case_id,
                        type: 1 << 1,
                        timestamp: Date.now(),
                        reason: entry.reason || '',
                        target: {
                            id: user.id,
                            name: user.tag
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

    const tempban = self.tempbans.get(`${guild.id}:${user.id}`)
    
    if (tempban) await tempban.delete()

    await GuildBanRemove(self, server, guild, user)

    return true
}

module.exports = {
    name: 'guildBanRemove',
    fn: execute
}