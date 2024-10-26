import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'
import { capitalizeFirstLetter } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, data: GuildBanRemoveLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.guild_ban_remove.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data,
        user = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_ban_add.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

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
        await self.logger.handleError({ module: 'LogsGuildBanRemove', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'GuildBanRemove',
        guild: { id: guild.id, name: guild.name },
        target: { id: user.id, name: user.tag }
    })

    return true
}

export interface GuildBanRemoveLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.MemberBanRemove>
}
