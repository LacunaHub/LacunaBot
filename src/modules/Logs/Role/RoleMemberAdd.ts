import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, Collection, EmbedBuilder, GuildMember, Role } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember, roles: Collection<string, Role>): Promise<boolean> {
    if (server.moderation.logs.types.role_member_add.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = member.guild.channels.cache.get(server.moderation.logs.types.role_member_add.channel_id) as BaseGuildTextChannel

        const isOk = logChannel && logChannel.permissionsFor(member.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const audit = member.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberRoleUpdate })
                : null
            const entry = audit?.entries?.find(v => v.targetId === member.id)
            const executor = entry?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.RoleMemberAdded'))
                .setDescription(
                    t('Logs.RoleMemberAddedTemplate', {
                        username: `<@${executor?.id ?? '0'}>`,
                        target: `<@${member.id}> (${member.user.tag})`
                    })
                )
                .addFields([{ name: t('Common.Roles'), value: roles.map(role => `<@&${role.id}>`).join(', '), inline: true }])
                .setFooter({ text: `UID: ${member.id}` })
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsRoleMemberAdd', action: 'SendMessageViaWebhook', error: err, guild_id: member.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'RoleMemberAdd',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })

            return true
        }
    }

    return false
}
