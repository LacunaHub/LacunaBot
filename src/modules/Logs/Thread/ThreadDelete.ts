import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: ThreadDeleteLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.thread_delete.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const thread = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.thread_delete.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.ThreadDeleted'))
        .setDescription(t('Logs.ThreadDeletedTemplate', { username: `<@${executor?.id ?? '0'}>`, thread: `**${thread.name}**` }))
        .setFooter({ text: `TID: ${thread.id}` })
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({ module: 'LogsThreadDelete', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'ThreadDelete',
        guild: { id: guild.id, name: guild.name },
        target: { id: thread.id, name: thread.name }
    })

    return true
}

export interface ThreadDeleteLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ThreadDelete>
}
