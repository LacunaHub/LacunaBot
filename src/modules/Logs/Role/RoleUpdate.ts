import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Role } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: Role, role: Role): Promise<boolean> {
    if (server.moderation.logs.types.role_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = role.guild.channels.cache.get(server.moderation.logs.types.role_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(role.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = role.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (before.name !== role.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.role_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.role_update_name_change_template', { role: `<@&${role.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.name, inline: true },
                        { name: t('logs.after_change'), value: role.name, inline: true }
                    ])
                    .setFooter({ text: role.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    self.logger.handleError({ module: 'LogsRoleUpdateName', action: 'SendMessageViaWebhook', error: err, guild_id: role.guild.id })

                    return false
                }
            }

            if (before.hexColor !== role.hexColor) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.role_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.role_update_color_change_template', { role: `<@&${role.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: `\`${before.hexColor}\``, inline: true },
                        { name: t('logs.after_change'), value: `\`${role.hexColor}\``, inline: true }
                    ])
                    .setFooter({ text: role.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    self.logger.handleError({ module: 'LogsRoleUpdateColor', action: 'SendMessageViaWebhook', error: err, guild_id: role.guild.id })

                    return false
                }
            }

            if (before.permissions !== role.permissions) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.role_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.role_update_permissions_change_template', { role: `<@&${role.id}>` })
                        })
                    )
                    .setFooter({ text: role.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    self.logger.handleError({
                        module: 'LogsRoleUpdatePermissions',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: role.guild.id
                    })

                    return false
                }
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'RoleUpdate',
                guild: { id: role.guild.id, name: role.guild.name },
                target: { id: role.name, name: role.id }
            })

            return true
        }
    }

    return false
}
