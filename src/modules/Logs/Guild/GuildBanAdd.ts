import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'
import { capitalizeFirstLetter } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, data: GuildBanAddLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.guild_ban_add.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data,
        user = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_ban_add.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.GuildBanAdded'))
        .setDescription(
            t('Logs.GuildBanAddedTemplate', {
                username: `<@${executor?.id ?? '0'}> (${executor?.tag ?? 'unknown'})`,
                target: `<@${user.id}> (${user.tag})`
            })
        )
        .addFields([{ name: capitalizeFirstLetter(t('Commands.Options.Reason')), value: auditLogEntry.reason ?? '-' }])
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({ module: 'LogsGuildBanAdd', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'GuildBanAdd',
        guild: { id: guild.id, name: guild.name },
        target: { id: user.id, name: user.tag }
    })

    return true
}

export interface GuildBanAddLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.MemberBanAdd>
}
