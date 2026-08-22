import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry, GuildChannel } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    data: ChannelDeleteLogEventData
): Promise<boolean> {
    if (!server.moderation.logs.types.channel_delete.active) return false
    if (isRateLimited(server._id)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const channel = auditLogEntry.target as GuildChannel,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.channel_delete.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.ChannelDeleted'))
        .setDescription(
            t('Logs.ChannelDeletedTemplate', { username: `<@${executor?.id ?? '0'}>`, channel: `**#${channel.name}**` })
        )
        .setFooter({ text: `CID: ${channel.id}` })
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({
            module: 'LogsChannelDelete',
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
        category: 'ChannelDelete'
    })

    return true
}

export interface ChannelDeleteLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.ChannelDelete>
}
