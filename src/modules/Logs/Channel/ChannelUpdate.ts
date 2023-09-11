import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildChannel, TextChannel } from 'discord.js'
import numbro from 'numbro'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildChannel, channel: GuildChannel): Promise<boolean> {
    if (server.moderation.logs.types.channel_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = channel.guild.channels.cache.get(server.moderation.logs.types.channel_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(channel.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = channel.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (before.name !== channel.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_name_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('logs.before_change'), value: before.name, inline: true },
                        { name: t('logs.after_change'), value: channel.name, inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsChannelUpdateName',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: channel.guildId
                    })

                    return false
                }
            }

            if ((before as any).topic !== (channel as any).topic) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_topic_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('logs.before_change'), value: (before as any).topic ?? '-', inline: true },
                        { name: t('logs.after_change'), value: (channel as any).topic ?? '-', inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsChannelUpdateTopic',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: channel.guildId
                    })

                    return false
                }
            }

            if ((before as TextChannel).rateLimitPerUser !== (channel as TextChannel).rateLimitPerUser) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_rate_limit_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        {
                            name: t('logs.before_change'),
                            value: (before as TextChannel).rateLimitPerUser
                                ? numbro((before as TextChannel).rateLimitPerUser).format({ output: 'time' })
                                : '-',
                            inline: true
                        },
                        {
                            name: t('logs.after_change'),
                            value: (channel as TextChannel).rateLimitPerUser
                                ? numbro((channel as TextChannel).rateLimitPerUser).format({ output: 'time' })
                                : '-',
                            inline: true
                        }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsChannelUpdateRateLimit',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: channel.guildId
                    })

                    return false
                }
            }

            if (before.parentId !== channel.parentId) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_parent_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('logs.before_change'), value: before?.parent?.name ?? '-', inline: true },
                        { name: t('logs.after_change'), value: channel?.parent?.name ?? '-', inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsChannelUpdateParent',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: channel.guildId
                    })

                    return false
                }
            }

            if (before.isVoiceBased() && channel.isVoiceBased() && before.bitrate !== channel.bitrate) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_bitrate_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('logs.before_change'), value: `${before.bitrate / 1000}kbps`, inline: true },
                        { name: t('logs.after_change'), value: `${channel.bitrate / 1000}kbps`, inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsChannelUpdateBitrate',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: channel.guildId
                    })

                    return false
                }
            }

            if (before.isVoiceBased() && channel.isVoiceBased() && before.userLimit !== channel.userLimit) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.channel_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.channel_update_user_limit_change_template', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('logs.before_change'), value: before.userLimit.toString(), inline: true },
                        { name: t('logs.after_change'), value: channel.userLimit.toString(), inline: true }
                    ])
                    .setFooter({ text: channel.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsChannelUpdateUserLimit',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: channel.guildId
                    })

                    return false
                }
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'ChannelUpdate',
                guild: { id: channel.guild.id, name: channel.guild.name },
                target: { id: channel.id, name: channel.name }
            })

            return true
        }
    }

    return false
}
