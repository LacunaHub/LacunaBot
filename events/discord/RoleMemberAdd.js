const RoleMemberAdd = require('../../modules/Logs/Role/RoleMemberAdd')
const { MessageEmbed } = require('discord.js')
const { images } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Collection<string, import('discord.js').Role>} roles
 */
const execute = async (self, member, roles) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.guild.id == '740586549145763960' && ['746826292900528311', '746825558205136926', '746752483115794583', '842088941678886962'].some(r => roles.has(r))) {
        const user = await self.db.users.fetch({ _id: member.id })
        
        if (user) {
            if (roles.has('746826292900528311')) {
                await self.db.users.update({ _id: member.id }, {
                    $set: {
                        flags: user.flags | 1 << 0,
                        'boost.available': true,
                        'boost.tier': 100
                    },
                    $push: {
                        'boost.type': 'DEVELOPER'
                    }
                })
            }
    
            if (roles.has('746825558205136926')) {
                await self.db.users.update({ _id: member.id }, {
                    $set: {
                        flags: user.flags | 1 << 1,
                        'boost.available': true,
                        'boost.tier': user.boost.tier + 2
                    },
                    $push: {
                        'boost.type': 'TEAM'
                    }
                })
            }
    
            if (roles.has('746752483115794583')) {
                await self.db.users.update({ _id: member.id }, {
                    $set: {
                        'boost.available': true,
                        'boost.tier': user.boost.tier + 1
                    },
                    $push: {
                        'boost.type': 'SERVER_BOOST'
                    }
                })
            }

            if (roles.has('842088941678886962')) {
                await self.db.users.update({ _id: member.id }, {
                    $set: {
                        'boost.available': true,
                        'boost.tier': user.boost.tier + 1
                    },
                    $push: {
                        'boost.type': 'GIVEAWAY_WINNER'
                    }
                })
            }
        }
    }

    const locale = self.translator.locale(server.locale)

    const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const mute_role = member.guild.roles.cache.get(server.moderation.roles.mute)

    if (case_log && (mute_role && roles.has(mute_role.id)) && member.guild.me.hasPermission('VIEW_AUDIT_LOG') && server.moderation.case_log.case_types.MUTE_ADD) {
        const audit = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_ROLE_UPDATE' })
        const entry = audit.entries.find(e => e.target.id == member.id)

        if (entry) {
            if (entry.executor.id == self.user.id && !(entry.reason && entry.reason.includes('Автомодер:'))) return false

            const case_id = server.moderation.case_log.cases.length + 1

            const embed = new MessageEmbed()
                .setAuthor(locale.commands.common.case_log.cases.MUTE_ADD, images.MUTE_ADD)
                .addField(locale.commands.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
                .addField(locale.commands.common.case_log.executor, entry.executor.tag, true)
                .addField(locale.commands.common.case_log.reason, entry.reason || locale.commands.common.texts.none)
                .setFooter(self.translator.format(locale.commands.common.case_log.case, case_id))
                .setTimestamp()
                .setColor('#EF5350')

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

    await RoleMemberAdd(self, server, member, roles)

    return true
}

module.exports = {
    name: 'roleMemberAdd',
    fn: execute
}