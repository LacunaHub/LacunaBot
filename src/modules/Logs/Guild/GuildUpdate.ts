import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Guild, Webhook } from 'discord.js'
import numbro from 'numbro'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: Guild, guild: Guild): Promise<boolean> {
    if (server.moderation.logs.types.guild_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = guild.channels.cache.get(server.moderation.logs.types.guild_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: guild.id },
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.guild_update_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: guild.id },
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

            if (before.name != guild.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.guild_update_title'))
                    .setDescription(
                        t('logs.update_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, change: t('logs.guild_update_name_change') })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.name, inline: true },
                        { name: t('logs.after_change'), value: guild.name, inline: true }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.afkChannelId != guild.afkChannelId) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.guild_update_title'))
                    .setDescription(
                        t('logs.update_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, change: t('logs.guild_update_afk_channel_change') })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.afkChannel?.name ?? '-', inline: true },
                        { name: t('logs.after_change'), value: guild.afkChannel?.name ?? '-', inline: true }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.afkTimeout != guild.afkTimeout) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.guild_update_title'))
                    .setDescription(
                        t('logs.update_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, change: t('logs.guild_update_afk_timeout_change') })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.afkTimeout ? numbro(before.afkTimeout).format({ output: 'time' }) : '-', inline: true },
                        { name: t('logs.after_change'), value: guild.afkTimeout ? numbro(guild.afkTimeout).format({ output: 'time' }) : '-', inline: true }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.description != guild.description) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.guild_update_title'))
                    .setDescription(
                        t('logs.update_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, change: t('logs.guild_update_description_change') })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.description ?? '-', inline: true },
                        { name: t('logs.after_change'), value: guild.description ?? '-', inline: true }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            self.emit('moduleExecution', { module: 'Logs: Guild Update', guild: { id: guild.id, name: guild.name }, target: { id: guild.id, name: guild.name } })

            return true
        }
    }

    return false
}
