import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import numbro from 'numbro'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: GuildUpdateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.guild_update.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const { executor } = auditLogEntry

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_update.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const nameChange = auditLogEntry.changes.find(v => v.key === 'name'),
        afkChannelIdChange = auditLogEntry.changes.find(v => v.key === 'afk_channel_id'),
        afkTimeoutChange = auditLogEntry.changes.find(v => v.key === 'afk_timeout'),
        descriptionChange = auditLogEntry.changes.find(v => v.key === 'description')

    if (nameChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.GuildUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.GuildUpdatedName')
                })
            )
            .addFields([
                { name: t('Logs.BeforeChange'), value: nameChange.old ?? '-', inline: true },
                { name: t('Logs.AfterChange'), value: nameChange.new ?? '-', inline: true }
            ])
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            await self.logger.handleError({ module: 'LogsGuildUpdateName', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

            return false
        }
    }

    if (afkChannelIdChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.GuildUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.GuildUpdatedAFKChannel')
                })
            )
            .addFields([
                { name: t('Logs.BeforeChange'), value: afkChannelIdChange.old ? `<#${afkChannelIdChange.old}>` : '-', inline: true },
                { name: t('Logs.AfterChange'), value: afkChannelIdChange.new ? `<#${afkChannelIdChange.new}>` : '-', inline: true }
            ])
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            await self.logger.handleError({
                module: 'LogsGuildUpdateAfkChannel',
                action: 'SendMessageViaWebhook',
                error: err,
                guild_id: guild.id
            })

            return false
        }
    }

    if (afkTimeoutChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.GuildUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.GuildUpdatedAFKTimeout')
                })
            )
            .addFields([
                {
                    name: t('Logs.BeforeChange'),
                    value: afkTimeoutChange.old ? numbro(afkTimeoutChange.old).format({ output: 'time' }) : '-',
                    inline: true
                },
                {
                    name: t('Logs.AfterChange'),
                    value: afkTimeoutChange.new ? numbro(afkTimeoutChange.new).format({ output: 'time' }) : '-',
                    inline: true
                }
            ])
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            await self.logger.handleError({
                module: 'LogsGuildUpdateAfkTimeout',
                action: 'SendMessageViaWebhook',
                error: err,
                guild_id: guild.id
            })

            return false
        }
    }

    if (descriptionChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.GuildUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.GuildUpdatedDescription')
                })
            )
            .addFields([
                { name: t('Logs.BeforeChange'), value: descriptionChange.old ?? '-' },
                { name: t('Logs.AfterChange'), value: descriptionChange.new ?? '-' }
            ])
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            await self.logger.handleError({
                module: 'LogsGuildUpdateDescription',
                action: 'SendMessageViaWebhook',
                error: err,
                guild_id: guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'GuildUpdate',
        guild: { id: guild.id, name: guild.name },
        target: { id: guild.id, name: guild.name }
    })

    return true
}

export interface GuildUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.GuildUpdate>
}
