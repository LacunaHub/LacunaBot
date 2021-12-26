import { BaseGuildTextChannel, GuildMember, MessageEmbed, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { nicknamesModeration } from '../../modules/Automoder'
import Greeting from '../../modules/Greeting'
import { GuildMemberUpdate, images } from '../../modules/Logs'

const handler = async (self: Lacuna, before: GuildMember, member: GuildMember) => {
    if (self.user.id == member.id) return false

    if (before.partial) {
        before = await before.fetch().catch(() => {}) as GuildMember
    }

    if (member.partial) {
        member = await member.fetch().catch(() => {}) as GuildMember
    }

    if (!before || !member) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    if (member.roles.cache.some(r => !before.roles.cache.has(r.id))) {
        const roles = member.roles.cache.filter(r => !before.roles.cache.has(r.id))

        self.emit('roleMemberAdd', member, roles)
    }
    
    if (before.roles.cache.some(r => !member.roles.cache.has(r.id))) {
        const roles = before.roles.cache.filter(r => !member.roles.cache.has(r.id))

        self.emit('roleMemberRemove', member, roles)
    }

    if (member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED') && before.pending && !member.pending) await Greeting(self, server, member)

    if (before.communicationDisabledUntilTimestamp !== member.communicationDisabledUntilTimestamp) {
        const locale = self.translator.locale(server.locale)
        const case_log = member.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel

        if (case_log && member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) && (server.moderation.case_log.case_types.MUTE_ADD || server.moderation.case_log.case_types.MUTE_REMOVE)) {
            const audit = await member.guild.fetchAuditLogs({ limit: 5, type: 'MEMBER_UPDATE' })
            const entry = audit.entries.find(e => (e.target as User).id == member.id)
    
            if (entry && (entry.executor.id != self.user.id || entry.reason?.includes('Автомодер:'))) {
                const case_id: number = server.moderation.case_log.cases.length + 1
    
                const embed = new MessageEmbed()
                    .setAuthor({ name: member.communicationDisabledUntilTimestamp ? locale.commands.common.case_log.cases.MUTE_ADD : locale.commands.common.case_log.cases.MUTE_REMOVE, iconURL: member.communicationDisabledUntilTimestamp ? images.MUTE_ADD : images.MUTE_REMOVE })
                    .addField(locale.commands.common.case_log.target, `${member.user.tag}\n(${member.id})`, true)
                    .addField(locale.commands.common.case_log.executor, entry.executor.tag, true)
                    .addField(locale.commands.common.case_log.reason, entry.reason ?? '-')
                    .setFooter(self.translator.format(locale.commands.common.case_log.case, case_id))
                    .setTimestamp()
                    .setColor(member.communicationDisabledUntilTimestamp ? '#EF5350' : '#2FDF84')
    
                await case_log.send({ embeds: [embed] }).catch(() => {})
    
                await self.db.servers.updateOne({ _id: member.guild.id }, {
                    $push: {
                        'moderation.case_log.cases': {
                            case_id: case_id,
                            type: member.communicationDisabledUntilTimestamp ? 1 << 3 : 1 << 4,
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
    }

    await GuildMemberUpdate(self, server, before, member)

    await nicknamesModeration(self, server, member)

    return true
}

export default {
    name: 'guildMemberUpdate',
    handler
}