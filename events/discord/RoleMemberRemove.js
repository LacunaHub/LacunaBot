const RoleMemberRemove = require('../../modules/Logs/Role/RoleMemberRemove')
const { MessageEmbed } = require('discord.js')
const { images } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Collection<string, import('discord.js').Role>} roles
 */
const handler = async (self, member, roles) => {
    const server = await self.db.servers.fetch({ _id: member.guild.id })

    const locale = self.translator.locale(server.locale)

    const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const mute_role = member.guild.roles.cache.get(server.moderation.roles.mute)

    const tempmute = self.tempmutes.get(`${member.guild.id}:${member.id}`)

    if (tempmute && (mute_role && roles.has(mute_role.id))) await tempmute.delete(false)

    if (case_log && (mute_role && roles.has(mute_role.id)) && member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) && server.moderation.case_log.case_types.MUTE_REMOVE) {
        const audit = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_ROLE_UPDATE' })
        const entry = audit.entries.find(e => e.target.id == member.id)

        if (entry && entry.executor.id != self.user.id) {
            const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == member.id)

            if (returnable_roles) {
                await self.db.servers.update({ _id: member.guild.id }, {
                    $pull: {
                        'moderation.roles.on_mute.returnable_roles': {
                            user_id: member.id
                        }
                    }
                })
    
                await member.roles.add(returnable_roles.roles.filter(r => member.guild.roles.cache.has(r)))
            }

            const case_id = server.moderation.case_log.cases.length + 1

            const embed = new MessageEmbed()
                .setAuthor(locale.commands.common.case_log.cases.MUTE_REMOVE, images.MUTE_REMOVE)
                .addField(locale.commands.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
                .addField(locale.commands.common.case_log.executor, entry.executor.tag, true)
                .addField(locale.commands.common.case_log.reason, entry.reason ?? '-')
                .setFooter(self.translator.format(locale.commands.common.case_log.case, case_id))
                .setTimestamp()
                .setColor('#2FDF84')

            await case_log.send({ embeds: [embed] })

            await self.db.servers.update({ _id: member.guild.id }, {
                $push: {
                    'moderation.case_log.cases': {
                        case_id: case_id,
                        type: 1 << 4,
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

    await RoleMemberRemove(self, server, member, roles)

    return true
}

module.exports = {
    name: 'roleMemberRemove',
    handler
}