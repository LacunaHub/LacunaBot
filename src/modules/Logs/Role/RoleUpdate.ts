import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: RoleUpdateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.role_update.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const role = guild.roles.cache.get(auditLogEntry.targetId),
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.role_update.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const nameChange = auditLogEntry.changes.find(v => v.key === 'name'),
        colorChange = auditLogEntry.changes.find(v => v.key === 'color'),
        permissionsChange = auditLogEntry.changes.find(v => v.key === 'permissions')

    if (nameChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.RoleUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.RoleUpdatedName', { role: `<@&${role.id}>` })
                })
            )
            .addFields([
                { name: t('Logs.BeforeChange'), value: nameChange.old ?? '-', inline: true },
                { name: t('Logs.AfterChange'), value: nameChange.new ?? '-', inline: true }
            ])
            .setFooter({ text: `RID: ${role.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            await self.logger.handleError({
                module: 'LogsRoleUpdateName',
                action: 'SendMessageViaWebhook',
                error: err,
                guild_id: guild.id
            })

            return false
        }
    }

    if (colorChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.RoleUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                    change: t('Logs.RoleUpdatedColor', { role: `<@&${role.id}>` })
                })
            )
            .addFields([
                {
                    name: t('Logs.BeforeChange'),
                    value: colorChange.old ? `\`#${colorChange.old.toString(16).padStart(6, '0')}\`` : '-',
                    inline: true
                },
                { name: t('Logs.AfterChange'), value: colorChange.new ? `\`#${colorChange.new.toString(16).padStart(6, '0')}\`` : '-', inline: true }
            ])
            .setFooter({ text: role.id })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            await self.logger.handleError({
                module: 'LogsRoleUpdateColor',
                action: 'SendMessageViaWebhook',
                error: err,
                guild_id: guild.id
            })

            return false
        }
    }

    if (permissionsChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.RoleUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                    change: t('Logs.RoleUpdatedPermissions', { role: `<@&${role.id}>` })
                })
            )
            .setFooter({ text: role.id })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            await self.logger.handleError({
                module: 'LogsRoleUpdatePermissions',
                action: 'SendMessageViaWebhook',
                error: err,
                guild_id: guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'RoleUpdate',
        guild: { id: guild.id, name: guild.name },
        target: { id: role.name, name: role.id }
    })

    return true
}

export interface RoleUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.RoleUpdate>
}
