import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    data: GuildMemberRoleAddLogEventData
): Promise<boolean> {
    if (!server.moderation.logs.types.role_member_add.active) return false
    if (isRateLimited(server._id)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const { target, executor } = auditLogEntry

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.role_member_add.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const addChange = auditLogEntry.changes.find(v => v.key === '$add')

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.RoleMemberAdded'))
        .setDescription(
            t('Logs.RoleMemberAddedTemplate', {
                username: `<@${executor?.id ?? '0'}>`,
                target: `<@${target!.id}> (${target!.tag})`
            })
        )
        .addFields([
            {
                name: t('Common.Roles'),
                value: addChange?.new?.map(v => `<@&${v.id}>`)?.join(', ') || '\u200B',
                inline: true
            }
        ])
        .setFooter({ text: `UID: ${target!.id}` })
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({ module: 'LogsGuildMemberRoleAdd', action: 'SendMessageViaWebhook', err, guildId: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: target!.id,
        module: 'Logs',
        category: 'GuildMemberRoleAdd'
    })

    return true
}

export interface GuildMemberRoleAddLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.MemberRoleUpdate>
}
