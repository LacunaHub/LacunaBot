import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Role } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, role: Role): Promise<boolean> {
    if (server.moderation.logs.types.role_delete.active) {
        if (isRateLimited(server._id) && !server.server.premium.available) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = role.guild.channels.cache.get(server.moderation.logs.types.role_delete.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(role.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = role.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete })
                : null
            const executor = audit?.entries?.first()?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.RoleDeleted'))
                .setDescription(t('Logs.RoleDeletedTemplate', { username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`, role: `<@&${role.id}>` }))
                .addFields([
                    { name: t('Logs.RoleColor'), value: `\`${role.hexColor}\``, inline: true },
                    { name: t('Logs.RolePosition'), value: role.rawPosition.toString(), inline: true }
                ])
                .setFooter({ text: role.id })
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsRoleDelete', action: 'SendMessageViaWebhook', error: err, guild_id: role.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'RoleDelete',
                guild: { id: role.guild.id, name: role.guild.name },
                target: { id: role.name, name: role.id }
            })

            return true
        }
    }

    return false
}
