import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: RoleCreateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.role_create.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const role = guild.roles.cache.get(auditLogEntry.targetId),
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.role_create.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.RoleCreated'))
        .setDescription(t('Logs.RoleCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, role: `<@&${role.id}>` }))
        .addFields([
            { name: t('Logs.RoleColor'), value: `\`${role.hexColor}\``, inline: true },
            { name: t('Logs.RolePosition'), value: role.rawPosition.toString(), inline: true }
        ])
        .setFooter({ text: `RID: ${role.id}` })
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({ module: 'LogsRoleCreate', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'RoleCreate',
        guild: { id: guild.id, name: guild.name },
        target: { id: role.name, name: role.id }
    })

    return true
}

export interface RoleCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.RoleCreate>
}
