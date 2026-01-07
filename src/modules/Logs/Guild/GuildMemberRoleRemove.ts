import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: GuildMemberRoleRemoveLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.role_member_remove.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const { target, executor } = auditLogEntry

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.role_member_remove.channel_id) as BaseGuildTextChannel
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const removeChange = auditLogEntry.changes.find(v => v.key === '$remove')

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.RoleMemberRemoved'))
        .setDescription(
            t('Logs.RoleMemberRemovedTemplate', {
                username: `<@${executor?.id ?? '0'}>`,
                target: `<@${target.id}> (${target.tag})`
            })
        )
        .addFields([{ name: t('Common.Roles'), value: removeChange.new.map(v => `<@&${v.id}>`).join(', '), inline: true }])
        .setFooter({ text: `UID: ${target.id}` })
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({
            module: 'LogsGuildMemberRoleRemove',
            action: 'SendMessageViaWebhook',
            error: err,
            guild_id: guild.id
        })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'GuildMemberRoleRemove',
        guild: { id: guild.id, name: guild.name },
        target: { id: target.id, name: target.tag }
    })

    return true
}

export interface GuildMemberRoleRemoveLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.MemberRoleUpdate>
}
