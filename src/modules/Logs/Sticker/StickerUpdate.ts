import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: StickerUpdateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.sticker_update.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const sticker = guild.stickers.cache.get(auditLogEntry.targetId),
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.sticker_update.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const nameChange = auditLogEntry.changes.find(v => v.key === 'name')

    if (nameChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.StickerUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.StickerUpdatedName', { sticker: `**${sticker.name}**` })
                })
            )
            .addFields([
                { name: t('Logs.BeforeChange'), value: nameChange.old ?? '-', inline: true },
                { name: t('Logs.AfterChange'), value: nameChange.new ?? '-', inline: true }
            ])
            .setFooter({ text: `SID: ${sticker.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsStickerUpdateName',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: sticker.id,
        module: 'Logs',
        category: 'StickerUpdate'
    })

    return true
}

export interface StickerUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.StickerUpdate>
}
