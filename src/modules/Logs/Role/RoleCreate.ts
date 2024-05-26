import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Role } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, role: Role): Promise<boolean> {
    if (server.moderation.logs.types.role_create.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = role.guild.channels.cache.get(server.moderation.logs.types.role_create.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(role.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = role.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await role.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.RoleCreate })
                : null
            const entry = audit?.entries?.find(v => v.targetId === role.id)
            const executor = entry?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.RoleCreated'))
                .setDescription(t('Logs.RoleCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, role: `<@&${role.id}>` }))
                .addFields([
                    { name: t('Logs.RoleColor'), value: `\`${role.hexColor}\``, inline: true },
                    { name: t('Logs.RolePosition'), value: role.rawPosition.toString(), inline: true }
                ])
                .setFooter({ text: `RID: ${role.id}` })
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await webhook.send({ embeds: [embed] })
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
