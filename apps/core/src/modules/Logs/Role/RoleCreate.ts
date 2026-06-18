import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, data: RoleCreateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.role_create.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const role = guild.roles.cache.get(auditLogEntry.targetId!)!,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.role_create.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.RoleCreated'))
        .setDescription(
            t('Logs.RoleCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, role: `<@&${role.id}>` })
        )
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
        self.logger.error({ module: 'LogsRoleCreate', action: 'SendMessageViaWebhook', err, guildId: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: role.id,
        module: 'Logs',
        category: 'RoleCreate'
    })

    return true
}

export interface RoleCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.RoleCreate>
}
