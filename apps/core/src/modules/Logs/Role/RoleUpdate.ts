import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, data: RoleUpdateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.role_update.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const role = guild.roles.cache.get(auditLogEntry.targetId!)!,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.role_update.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

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
            self.logger.error({
                module: 'LogsRoleUpdateName',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
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
                {
                    name: t('Logs.AfterChange'),
                    value: colorChange.new ? `\`#${colorChange.new.toString(16).padStart(6, '0')}\`` : '-',
                    inline: true
                }
            ])
            .setFooter({ text: role.id })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsRoleUpdateColor',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
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
            self.logger.error({
                module: 'LogsRoleUpdatePermissions',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: role.id,
        module: 'Logs',
        category: 'RoleUpdate'
    })

    return true
}

export interface RoleUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.RoleUpdate>
}
