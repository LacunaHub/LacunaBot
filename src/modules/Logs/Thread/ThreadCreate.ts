import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import numbro from 'numbro'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: ThreadCreateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.thread_create.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const thread = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.thread_create.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.ThreadCreated'))
        .setDescription(t('Logs.ThreadCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, thread: `<#${thread.id}>` }))
        .addFields([
            { name: t('Commands.OptionTypes.Channel'), value: thread.parentId ? `<#${thread.parentId}>` : '-', inline: true },
            {
                name: t('Logs.ThreadAutoArchiveTime'),
                value: numbro((thread.autoArchiveDuration as number) * 60).format({ output: 'time' }),
                inline: true
            }
        ])
        .setFooter({ text: `TID: ${thread.id}` })
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({ module: 'LogsThreadCreate', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'ThreadCreate',
        guild: { id: guild.id, name: guild.name },
        target: { id: thread.id, name: thread.name }
    })

    return true
}

export interface ThreadCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ThreadCreate>
}
