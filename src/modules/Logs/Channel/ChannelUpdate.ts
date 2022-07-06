import { BaseGuildTextChannel, GuildChannel, MessageEmbed, TextChannel, Webhook } from 'discord.js'
import numbro from 'numbro'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildChannel, channel: GuildChannel): Promise<boolean> {
    if (server.moderation.logs.types.channel_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(channel.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = channel.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG)
                ? await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_UPDATE' })
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
                    webhook = await log.createWebhook(`${self.user.username}`, {
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
                const embed = new MessageEmbed()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_name_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addField(t('logs.before_change'), before.name, true)
                    .addField(t('logs.after_change'), channel.name, true)
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.isText() && channel.isText() && before.topic != channel.topic) {
                const embed = new MessageEmbed()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_topic_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addField(t('logs.before_change'), before.topic ?? '-', true)
                    .addField(t('logs.after_change'), channel.topic ?? '-', true)
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
                const embed = new MessageEmbed()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_rate_limit_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addField(
                        t('logs.before_change'),
                        (before as TextChannel).rateLimitPerUser ? numbro((before as TextChannel).rateLimitPerUser).format({ output: 'time' }) : '-',
                        true
                    )
                    .addField(
                        t('logs.after_change'),
                        (channel as TextChannel).rateLimitPerUser ? numbro((channel as TextChannel).rateLimitPerUser).format({ output: 'time' }) : '-',
                        true
                    )
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
                const embed = new MessageEmbed()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_parent_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addField(t('logs.before_change'), before?.parent?.name ?? '-', true)
                    .addField(t('logs.after_change'), channel?.parent?.name ?? '-', true)
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.isVoice() && channel.isVoice() && before.bitrate != channel.bitrate) {
                const embed = new MessageEmbed()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_bitrate_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addField(t('logs.before_change'), `${before.bitrate / 1000}kbps`, true)
                    .addField(t('logs.after_change'), `${channel.bitrate / 1000}kbps`, true)
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.isVoice() && channel.isVoice() && before.userLimit != channel.userLimit) {
                const embed = new MessageEmbed()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_user_limit_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .addField(t('logs.before_change'), before.userLimit.toString(), true)
                    .addField(t('logs.after_change'), channel.userLimit.toString(), true)
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
