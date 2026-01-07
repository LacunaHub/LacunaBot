import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: EmojiUpdateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.emoji_update.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const emoji = guild.emojis.cache.get(auditLogEntry.targetId),
        executor = auditLogEntry.executor

    const logChannel = emoji.guild.channels.cache.get(server.moderation.logs.types.emoji_update.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const nameChange = auditLogEntry.changes.find(v => v.key === 'name')

    if (nameChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.EmojiUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.EmojiUpdatedName', { emoji: emoji.toString() })
                })
            )
            .setFields([
                { name: t('Logs.BeforeChange'), value: nameChange.old ?? '-' },
                { name: t('Logs.AfterChange'), value: nameChange.new ?? '-' }
            ])
            .setFooter({ text: `EID: ${emoji.id}` })
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            await self.logger.handleError({
                module: 'LogsEmojiUpdateName',
                action: 'SendMessageViaWebhook',
                error: err,
                guild_id: emoji.guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'EmojiUpdate',
        guild: { id: guild.id, name: guild.name },
        target: { id: emoji.id, name: emoji.name }
    })

    return true
}

export interface EmojiUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.EmojiUpdate>
}
