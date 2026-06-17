import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry, GuildChannel } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    data: ChannelCreateLogEventData
): Promise<boolean> {
    if (!server.moderation.logs.types.channel_create.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const channel = auditLogEntry.target as GuildChannel,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.channel_create.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.ChannelCreated'))
        .setDescription(
            t('Logs.ChannelCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, channel: `<#${channel.id}>` })
        )
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
        self.logger.error({
            module: 'LogsChannelCreate',
            action: 'SendMessageViaWebhook',
            err,
            guildId: channel.guildId
        })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: channel.id,
        module: 'Logs',
        category: 'ChannelCreate'
    })

    return true
}

export interface ChannelCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ChannelCreate>
}
