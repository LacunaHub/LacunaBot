import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Role, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: Role, role: Role): Promise<boolean> {
    if (server.moderation.logs.types.role_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = role.guild.channels.cache.get(server.moderation.logs.types.role_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(role.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = role.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: role.guild.id },
                        {
                            $pull: {
                                'moderation.logs.webhooks': {
                                    channel_id: log.id
                                }
                            }
                        }
                    )
                }

                try {
                    webhook = await log.createWebhook({
                        name: self.user.username,
                        avatar: self.user.displayAvatarURL(),
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.role_update_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: role.guild.id },
                    {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelId
                            }
                        }
                    }
                )
            }

            if (before.name != role.name) {
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

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.hexColor != role.hexColor) {
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

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.permissions != role.permissions) {
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

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
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
