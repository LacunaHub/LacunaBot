import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildChannel, TextChannel, Webhook } from 'discord.js'
import numbro from 'numbro'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildChannel, channel: GuildChannel): Promise<boolean> {
    if (server.moderation.logs.types.channel_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(channel.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = channel.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate })
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.channel_update_title') })
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

            if (before.name != channel.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_name_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.name, inline: true },
                        { name: t('logs.after_change'), value: channel.name, inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if ((before as any).topic != (channel as any).topic) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_topic_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: (before as any).topic ?? '-', inline: true },
                        { name: t('logs.after_change'), value: (channel as any).topic ?? '-', inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if ((before as TextChannel).rateLimitPerUser != (channel as TextChannel).rateLimitPerUser) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_rate_limit_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addFields([
                        {
                            name: t('logs.before_change'),
                            value: (before as TextChannel).rateLimitPerUser ? numbro((before as TextChannel).rateLimitPerUser).format({ output: 'time' }) : '-',
                            inline: true
                        },
                        {
                            name: t('logs.after_change'),
                            value: (channel as TextChannel).rateLimitPerUser ? numbro((channel as TextChannel).rateLimitPerUser).format({ output: 'time' }) : '-',
                            inline: true
                        }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.parentId != channel.parentId) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_parent_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before?.parent?.name ?? '-', inline: true },
                        { name: t('logs.after_change'), value: channel?.parent?.name ?? '-', inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.isVoiceBased() && channel.isVoiceBased() && before.bitrate != channel.bitrate) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_bitrate_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: `${before.bitrate / 1000}kbps`, inline: true },
                        { name: t('logs.after_change'), value: `${channel.bitrate / 1000}kbps`, inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.isVoiceBased() && channel.isVoiceBased() && before.userLimit != channel.userLimit) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_user_limit_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.userLimit.toString(), inline: true },
                        { name: t('logs.after_change'), value: channel.userLimit.toString(), inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            self.emit('moduleExecution', {
                module: 'Logs: Channel Update',
                guild: { id: channel.guild.id, name: channel.guild.name },
                target: { id: channel.id, name: channel.name }
            })

            return true
        }
    }

    return false
}
