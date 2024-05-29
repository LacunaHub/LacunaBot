import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildChannel, TextChannel } from 'discord.js'
import numbro from 'numbro'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildChannel, channel: GuildChannel): Promise<boolean> {
    if (server.moderation.logs.types.channel_update.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = channel.guild.channels.cache.get(server.moderation.logs.types.channel_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(channel.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = channel.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await channel.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.ChannelUpdate })
                : null
            const entry = audit?.entries?.find(v => v.targetId === channel.id)
            const executor = entry?.executor

            if (before.name !== channel.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.ChannelUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `<@${executor?.id ?? '0'}>`,
                            change: t('Logs.ChannelUpdatedName', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('Logs.BeforeChange'), value: before.name, inline: true },
                        { name: t('Logs.AfterChange'), value: channel.name, inline: true }
                    ])
                    .setFooter({ text: `CID: ${channel.id}` })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({ embeds: [embed] })
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

            if (before['topic'] !== channel['topic']) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.ChannelUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.ChannelUpdatedTopic', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('Logs.BeforeChange'), value: (before as any).topic ?? '-', inline: true },
                        { name: t('Logs.AfterChange'), value: (channel as any).topic ?? '-', inline: true }
                    ])
                    .setFooter({ text: `CID: ${channel.id}` })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({ embeds: [embed] })
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

            if (before.isTextBased() && channel.isTextBased() && before.rateLimitPerUser !== channel.rateLimitPerUser) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.ChannelUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.ChannelUpdatedRateLimit', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        {
                            name: t('Logs.BeforeChange'),
                            value: (before as TextChannel).rateLimitPerUser
                                ? numbro((before as TextChannel).rateLimitPerUser).format({ output: 'time' })
                                : '-',
                            inline: true
                        },
                        {
                            name: t('Logs.AfterChange'),
                            value: (channel as TextChannel).rateLimitPerUser
                                ? numbro((channel as TextChannel).rateLimitPerUser).format({ output: 'time' })
                                : '-',
                            inline: true
                        }
                    ])
                    .setFooter({ text: `CID: ${channel.id}` })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({ embeds: [embed] })
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
                    .setTitle(t('Logs.ChannelUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.ChannelUpdatedParent', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('Logs.BeforeChange'), value: before?.parent?.name ?? '-', inline: true },
                        { name: t('Logs.AfterChange'), value: channel?.parent?.name ?? '-', inline: true }
                    ])
                    .setFooter({ text: `CID: ${channel.id}` })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({ embeds: [embed] })
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
                    .setTitle(t('Logs.ChannelUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.ChannelUpdatedBitrate', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('Logs.BeforeChange'), value: `${before.bitrate / 1000}kbps`, inline: true },
                        { name: t('Logs.AfterChange'), value: `${channel.bitrate / 1000}kbps`, inline: true }
                    ])
                    .setFooter({ text: `CID: ${channel.id}` })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({ embeds: [embed] })
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
                    .setTitle(t('Logs.ChannelUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.ChannelUpdatedUserLimit', { channel: `<#${channel.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('Logs.BeforeChange'), value: before.userLimit.toString(), inline: true },
                        { name: t('Logs.AfterChange'), value: channel.userLimit.toString(), inline: true }
                    ])
                    .setFooter({ text: `CID: ${channel.id}` })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({ embeds: [embed] })
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
