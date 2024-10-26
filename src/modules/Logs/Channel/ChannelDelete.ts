import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry, GuildChannel } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: ChannelDeleteLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.channel_delete.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const channel = auditLogEntry.target as GuildChannel,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.channel_delete.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.ChannelDeleted'))
        .setDescription(t('Logs.ChannelDeletedTemplate', { username: `<@${executor?.id ?? '0'}>`, channel: `**#${channel.name}**` }))
        .setFooter({ text: `CID: ${channel.id}` })
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({ module: 'LogsChannelDelete', action: 'SendMessageViaWebhook', error: err, guild_id: channel.guildId })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'ChannelDelete',
        guild: { id: guild.id, name: guild.name },
        target: { id: channel.id, name: channel.name }
    })

    return true
}

export interface ChannelDeleteLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ChannelDelete>
}
