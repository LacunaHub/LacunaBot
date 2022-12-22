import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildChannel, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, channel: GuildChannel): Promise<boolean> {
    if (server.moderation.logs.types.channel_delete.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_delete.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(channel.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = channel.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete })
                : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: channel.guild.id },
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.channel_delete_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: channel.guild.id },
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

            const embed = new EmbedBuilder()
                .setTitle(t('logs.channel_delete_title'))
                .setDescription(t('logs.channel_delete_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, channel: `**${channel.name}**` }))
                .addFields([
                    { name: t('logs.channel_category'), value: channel?.parent?.name ?? '-', inline: true },
                    { name: t('logs.channel_position'), value: channel.rawPosition.toString(), inline: true }
                ])
                .setFooter({ text: channel.id })
                .setTimestamp()
                .setColor('#EF5350')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', {
                module: 'Logs: Channel Delete',
                guild: { id: channel.guild.id, name: channel.guild.name },
                target: { id: channel.id, name: channel.name }
            })

            return true
        }
    }

    return false
}
