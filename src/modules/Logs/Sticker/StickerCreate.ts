import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: StickerCreateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.sticker_create.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const sticker = guild.stickers.cache.get(auditLogEntry.targetId),
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.sticker_create.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.StickerCreated'))
        .setDescription(t('Logs.StickerCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, sticker: `**${sticker.name}**` }))
        .setFooter({ text: `SID: ${sticker.id}` })
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({ module: 'LogsStickerCreate', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'StickerCreate',
        guild: { id: guild.id, name: guild.name },
        target: { id: sticker.id, name: sticker.name }
    })

    return true
}

export interface StickerCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.StickerCreate>
}
