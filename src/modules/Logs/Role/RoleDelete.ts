import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: RoleDeleteLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.role_delete.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const role = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.role_delete.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const nameChange = auditLogEntry.changes.find(v => v.key === 'name')

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.RoleDeleted'))
        .setDescription(t('Logs.RoleDeletedTemplate', { username: `<@${executor?.id ?? '0'}>`, role: `**@${nameChange.old}**` }))
        .setFooter({ text: `RID: ${role.id}` })
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({ module: 'LogsRoleDelete', action: 'SendMessageViaWebhook', err, guildId: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: role.id,
        module: 'Logs',
        category: 'RoleDelete'
    })

    return true
}

export interface RoleDeleteLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.RoleDelete>
}
