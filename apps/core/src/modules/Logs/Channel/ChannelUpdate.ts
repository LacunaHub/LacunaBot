import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import numbro from 'numbro'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    data: ChannelUpdateLogEventData
): Promise<boolean> {
    if (!server.moderation.logs.types.channel_update.active) return false
    if (isRateLimited(server._id)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const channel = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.channel_update.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const nameChange = auditLogEntry.changes.find(v => v.key === 'name'),
        topicChange = auditLogEntry.changes.find(v => v.key === 'topic'),
        rateLimitPerUserChange = auditLogEntry.changes.find(v => v.key === 'rate_limit_per_user'),
        bitrateChange = auditLogEntry.changes.find(v => v.key === 'bitrate'),
        userLimitChange = auditLogEntry.changes.find(v => v.key === 'user_limit')

    if (nameChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.ChannelUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.ChannelUpdatedName', { channel: `<#${channel.id}>` })
                })
            )
            .setFields([
                { name: t('Logs.BeforeChange'), value: nameChange.old ?? '-', inline: true },
                { name: t('Logs.AfterChange'), value: nameChange.new ?? '-', inline: true }
            ])
            .setFooter({ text: `CID: ${channel.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsChannelUpdateName',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    if (topicChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.ChannelUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                    change: t('Logs.ChannelUpdatedTopic', { channel: `<#${channel.id}>` })
                })
            )
            .setFields([
                { name: t('Logs.BeforeChange'), value: topicChange.old ?? '-', inline: true },
                { name: t('Logs.AfterChange'), value: topicChange.new ?? '-', inline: true }
            ])
            .setFooter({ text: `CID: ${channel.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsChannelUpdateTopic',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    if (rateLimitPerUserChange) {
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
                    value: rateLimitPerUserChange.old
                        ? // @ts-expect-error
                          numbro(rateLimitPerUserChange.old).format({ output: 'time' })
                        : '-',
                    inline: true
                },
                {
                    name: t('Logs.AfterChange'),
                    value: rateLimitPerUserChange.new
                        ? // @ts-expect-error
                          numbro(rateLimitPerUserChange.new).format({ output: 'time' })
                        : '-',
                    inline: true
                }
            ])
            .setFooter({ text: `CID: ${channel.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsChannelUpdateRateLimit',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    if (bitrateChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.ChannelUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                    change: t('Logs.ChannelUpdatedBitrate', { channel: `<#${channel.id}>` })
                })
            )
            .setFields([
                { name: t('Logs.BeforeChange'), value: `${Number(bitrateChange.old) / 1000}kbps`, inline: true },
                { name: t('Logs.AfterChange'), value: `${Number(bitrateChange.new) / 1000}kbps`, inline: true }
            ])
            .setFooter({ text: `CID: ${channel.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsChannelUpdateBitrate',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    if (userLimitChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.ChannelUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                    change: t('Logs.ChannelUpdatedUserLimit', { channel: `<#${channel.id}>` })
                })
            )
            .setFields([
                { name: t('Logs.BeforeChange'), value: `${userLimitChange.old}`, inline: true },
                { name: t('Logs.AfterChange'), value: `${userLimitChange.new}`, inline: true }
            ])
            .setFooter({ text: `CID: ${channel.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsChannelUpdateUserLimit',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: channel.id,
        module: 'Logs',
        category: 'ChannelUpdate'
    })

    return true
}

export interface ChannelUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ChannelUpdate>
}
