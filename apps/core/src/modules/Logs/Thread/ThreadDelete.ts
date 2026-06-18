import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, data: ThreadDeleteLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.thread_delete.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const thread = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.thread_delete.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.ThreadDeleted'))
        .setDescription(
            t('Logs.ThreadDeletedTemplate', { username: `<@${executor?.id ?? '0'}>`, thread: `**${thread.name}**` })
        )
        .setFooter({ text: `TID: ${thread.id}` })
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({ module: 'LogsThreadDelete', action: 'SendMessageViaWebhook', err, guildId: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: thread.id,
        module: 'Logs',
        category: 'ThreadDelete'
    })

    return true
}

export interface ThreadDeleteLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ThreadDelete>
}
