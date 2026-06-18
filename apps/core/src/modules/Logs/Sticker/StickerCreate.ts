import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    data: StickerCreateLogEventData
): Promise<boolean> {
    if (!server.moderation.logs.types.sticker_create.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const sticker = guild.stickers.cache.get(auditLogEntry.targetId!)!,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.sticker_create.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.StickerCreated'))
        .setDescription(
            t('Logs.StickerCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, sticker: `**${sticker.name}**` })
        )
        .setFooter({ text: `SID: ${sticker.id}` })
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({ module: 'LogsStickerCreate', action: 'SendMessageViaWebhook', err, guildId: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: sticker.id,
        module: 'Logs',
        category: 'StickerCreate'
    })

    return true
}

export interface StickerCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.StickerCreate>
}
