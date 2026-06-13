import { ServerDocument } from '@/database/schemas/Servers'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: EmojiDeleteLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.emoji_delete.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const emoji = auditLogEntry.target,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.emoji_delete.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const nameChange = auditLogEntry.changes.find(v => v.key === 'name')

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.EmojiDeleted'))
        .setDescription(
            t('Logs.EmojiDeletedTemplate', {
                username: `<@${executor?.id ?? '0'}>`,
                emoji: `**${nameChange.old}**`
            })
        )
        .setFooter({ text: `EID: ${emoji.id}` })
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({ module: 'LogsEmojiDelete', action: 'SendMessageViaWebhook', err, guildId: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: emoji.id,
        module: 'Logs',
        category: 'EmojiDelete'
    })

    return true
}

export interface EmojiDeleteLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.EmojiDelete>
}
