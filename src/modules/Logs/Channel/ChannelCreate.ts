import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry, GuildChannel } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: ChannelCreateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.channel_create.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const channel = auditLogEntry.target as GuildChannel,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.channel_create.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.ChannelCreated'))
        .setDescription(t('Logs.ChannelCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, channel: `<#${channel.id}>` }))
        .addFields([
            { name: t('Logs.ChannelCategory'), value: channel?.parent?.name ?? '-', inline: true },
            { name: t('Logs.ChannelPosition'), value: channel.rawPosition.toString(), inline: true }
        ])
        .setFooter({ text: `CID: ${channel.id}` })
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({ module: 'LogsChannelCreate', action: 'SendMessageViaWebhook', error: err, guild_id: channel.guildId })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'ChannelCreate',
        guild: { id: guild.id, name: guild.name },
        target: { id: channel.id, name: channel.name }
    })

    return true
}

export interface ChannelCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ChannelCreate>
}
