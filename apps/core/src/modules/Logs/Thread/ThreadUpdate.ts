import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import numbro from 'numbro'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, data: ThreadUpdateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.thread_update.active) return false
    if (isRateLimited(server._id)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const thread = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.thread_update.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const nameChange = auditLogEntry.changes.find(v => v.key === 'name'),
        autoArchiveDurationChange = auditLogEntry.changes.find(v => v.key === 'auto_archive_duration')

    if (nameChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.ThreadUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.ThreadUpdatedName', { thread: `<#${thread.id}>` })
                })
            )
            .addFields([
                { name: t('Logs.BeforeChange'), value: nameChange.old ?? '-', inline: true },
                { name: t('Logs.AfterChange'), value: nameChange.new ?? '-', inline: true }
            ])
            .setFooter({ text: `TID: ${thread.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsThreadUpdateName',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    if (autoArchiveDurationChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.ThreadUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                    change: t('Logs.ThreadUpdatedAutoArchive', { thread: `<#${thread.id}>` })
                })
            )
            .addFields([
                {
                    name: t('Logs.BeforeChange'),
                    value: autoArchiveDurationChange.old
                        ? // @ts-expect-error
                          numbro(autoArchiveDurationChange.old * 60).format({ output: 'time' })
                        : '-',
                    inline: true
                },
                {
                    name: t('Logs.AfterChange'),
                    value: autoArchiveDurationChange.new
                        ? // @ts-expect-error
                          numbro(autoArchiveDurationChange.new * 60).format({ output: 'time' })
                        : '-',
                    inline: true
                }
            ])
            .setFooter({ text: thread.id })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsThreadUpdateAutoArchiveDuration',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: thread.id,
        module: 'Logs',
        category: 'ThreadUpdate'
    })

    return true
}

export interface ThreadUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ThreadUpdate>
}
