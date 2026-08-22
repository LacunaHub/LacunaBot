import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    data: GuildMemberRoleRemoveLogEventData
): Promise<boolean> {
    if (!server.moderation.logs.types.role_member_remove.active) return false
    if (isRateLimited(server._id)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const { target, executor } = auditLogEntry

    const logChannel = guild.channels.cache.get(
        server.moderation.logs.types.role_member_remove.channel_id!
    ) as BaseGuildTextChannel
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const removeChange = auditLogEntry.changes.find(v => v.key === '$remove')

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.RoleMemberRemoved'))
        .setDescription(
            t('Logs.RoleMemberRemovedTemplate', {
                username: `<@${executor?.id ?? '0'}>`,
                target: `<@${target!.id}> (${target!.tag})`
            })
        )
        .addFields([
            {
                name: t('Common.Roles'),
                value: removeChange?.new?.map(v => `<@&${v.id}>`)?.join(', ') || '\u200B',
                inline: true
            }
        ])
        .setFooter({ text: `UID: ${target!.id}` })
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({
            module: 'LogsGuildMemberRoleRemove',
            action: 'SendMessageViaWebhook',
            err,
            guildId: guild.id
        })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: target!.id,
        module: 'Logs',
        category: 'GuildMemberRoleRemove'
    })

    return true
}

export interface GuildMemberRoleRemoveLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.MemberRoleUpdate>
}
