import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Role } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, role: Role): Promise<boolean> {
    if (server.moderation.logs.types.role_create.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = role.guild.channels.cache.get(server.moderation.logs.types.role_create.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(role.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = role.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate })
                : null
            const executor = audit?.entries?.first()?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('logs.role_create_title'))
                .setDescription(
                    t('logs.role_create_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, role: `<@&${role.id}>` })
                )
                .addFields([
                    { name: t('logs.role_color'), value: `\`${role.hexColor}\``, inline: true },
                    { name: t('logs.role_position'), value: role.rawPosition.toString(), inline: true }
                ])
                .setFooter({ text: role.id })
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsRoleCreate', action: 'SendMessageViaWebhook', error: err, guild_id: role.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'RoleCreate',
                guild: { id: role.guild.id, name: role.guild.name },
                target: { id: role.name, name: role.id }
            })

            return true
        }
    }

    return false
}
