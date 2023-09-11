import { AuditLogEvent, BaseGuildTextChannel, Collection, EmbedBuilder, GuildMember, Role } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember, roles: Collection<string, Role>): Promise<boolean> {
    if (server.moderation.logs.types.role_member_remove.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = member.guild.channels.cache.get(server.moderation.logs.types.role_member_remove.channel_id) as BaseGuildTextChannel

        const isOk = logChannel && logChannel.permissionsFor(member.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = member.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('logs.role_member_remove_title'))
                .setDescription(
                    t('logs.role_member_remove_template', {
                        user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                        target: `**${member.user.tag}**`
                    })
                )
                .addFields([{ name: t('common.roles'), value: roles.map(role => `<@&${role.id}>`).join(', '), inline: true }])
                .setFooter({ text: member.id })
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({
                    module: 'LogsRoleMemberRemove',
                    action: 'SendMessageViaWebhook',
                    error: err,
                    guild_id: member.guild.id
                })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'RoleMemberRemove',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })

            return true
        }
    }

    return false
}
