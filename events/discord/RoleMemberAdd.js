const { RoleMemberAdd } = require('../../modules/Logs')
const { MessageEmbed } = require('discord.js')
const { images } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Role} role
 */
const execute = async (self, member, role) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.guild.id == '740586549145763960' && ['746826292900528311', '746825558205136926', '746752483115794583'].includes(role.id)) {
        const user = await self.db.users.fetch({ _id: member.id })

        if (role.id == '746826292900528311') {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    flags: user.flags | 1 << 0,
                    'boost.available': true,
                    'boost.type': 'DEVELOPER',
                    'boost.tier': 100
                }
            })
        }

        if (role.id == '746825558205136926') {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    flags: user.flags | 1 << 1,
                    'boost.available': true,
                    'boost.type': 'TEAM',
                    'boost.tier': user.boost.tier || 2
                }
            })
        }

        if (role.id == '746752483115794583' && !user.boost.available) {
            await self.db.users.update({ _id: member.id }, {
                $set: {
                    'boost.available': true,
                    'boost.type': 'SERVER_BOOST',
                    'boost.tier': 1
                }
            })
        }
    }

    const locale = self.translator.locale(server.locale)

    const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const mute_role = member.guild.roles.cache.get(server.moderation.roles.mute)

    if (case_log && (mute_role && mute_role.id == role.id) && member.guild.me.hasPermission('VIEW_AUDIT_LOG')) {
        const audit = await member.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_ROLE_UPDATE' })
        const entry = audit.entries.find(e => e.target.id == member.id)

        if (entry) {
            if (entry.executor.id == self.user.id) return false

            const case_id = server.moderation.case_log.cases.length + 1

            const embed = new MessageEmbed()
                .setTitle(locale.commands.common.case_log.cases.MUTE_ADD)
                .addField(locale.commands.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
                .addField(locale.commands.common.case_log.executor, entry.executor.tag, true)
                .addField(locale.commands.common.case_log.reason, entry.reason || locale.commands.common.texts.none)
                .setFooter(self.translator.format(locale.commands.common.case_log.case, case_id))
                .setThumbnail(images.MUTE_ADD)
                .setTimestamp()
                .setColor(0xF04747)

            await case_log.send(embed)

            await self.db.servers.update({ _id: member.guild.id }, {
                $push: {
                    'moderation.case_log.cases': {
                        case_id: case_id,
                        type: 1 << 3,
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

    await RoleMemberAdd(self, server, member, role)

    return true
}

module.exports = {
    name: 'roleMemberAdd',
    fn: execute
}