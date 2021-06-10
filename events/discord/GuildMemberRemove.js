const { MessageEmbed } = require('discord.js')
const Farewell = require('../../modules/Farewell')
const { GuildMemberRemove, images } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 */
const execute = async (self, member) => {
    if (member.partial) {
        member = await member.guild.members.fetch({ member: member.id, cache: false })
    }

    if (!member || !member.guild) return false

    const server = await self.db.servers.fetch({ _id: member.guild.id })

    const locale = self.translator.locale(server.locale).commands

    const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id)

    if (case_log && member.guild.me.hasPermission('VIEW_AUDIT_LOG') && server.moderation.case_log.case_types.KICK) {
        const audit = await member.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_KICK' })
        const entry = audit.entries.find(e => e.target.id == member.id)

        if (entry) {
            if (entry.executor.id == self.user.id && !(entry.reason && entry.reason.includes('Автомодер:'))) return false

            const case_id = server.moderation.case_log.cases.length + 1
    
            const embed = new MessageEmbed()
                .setAuthor(locale.common.case_log.cases.KICK, images.KICK)
                .addField(locale.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
                .addField(locale.common.case_log.executor, entry.executor.tag, true)
                .addField(locale.common.case_log.reason, entry.reason || locale.common.texts.none)
                .setFooter(self.translator.format(locale.common.case_log.case, case_id))
                .setTimestamp()
                .setColor('#EF5350')
            
            await case_log.send(embed)
    
            await self.db.servers.update({ _id: member.guild.id }, {
                $push: {
                    'moderation.case_log.cases': {
                        case_id: case_id,
                        type: 1 << 2,
                        timestamp: Date.now(),
                        reason: entry.reason || '',
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

    await Farewell.Handle(self, server, member)

    await GuildMemberRemove(self, server, member)

    if (server.modules.levels.reset_on_leave) {
        await self.db.activities.update({ _id: member.guild.id }, {
            $pull: {
                'levels': {
                    user_id: member.id
                }
            }
        })
    }

    return true
}

module.exports = {
    name: 'guildMemberRemove',
    fn: execute
}