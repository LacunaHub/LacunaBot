import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { capitalizeFirstLetter } from '@/internals/utility/Utils.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    data: GuildBanRemoveLogEventData
): Promise<boolean> {
    if (!server.moderation.logs.types.guild_ban_remove.active) return false
    if (isRateLimited(server._id)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data,
        user = auditLogEntry.target!,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_ban_add.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.GuildBanRemoved'))
        .setDescription(
            t('Logs.GuildBanRemovedTemplate', {
                username: `<@${executor?.id ?? '0'}>`,
                target: `<@${user.id}> (${user.tag})`
            })
        )
        .addFields([{ name: capitalizeFirstLetter(t('Commands.Options.Reason')), value: auditLogEntry.reason ?? '-' }])
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({ module: 'LogsGuildBanRemove', action: 'SendMessageViaWebhook', err, guildId: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: user.id,
        module: 'Logs',
        category: 'GuildBanRemove'
    })

    return true
}

export interface GuildBanRemoveLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.MemberBanRemove>
}
