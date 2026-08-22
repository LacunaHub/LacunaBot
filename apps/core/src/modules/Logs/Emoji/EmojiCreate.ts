import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, data: EmojiCreateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.emoji_create.active) return false
    if (isRateLimited(server._id)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const emoji = guild.emojis.cache.get(auditLogEntry.targetId!)!,
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.emoji_create.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.EmojiCreated'))
        .setDescription(
            t('Logs.EmojiCreatedTemplate', {
                username: `<@${executor?.id ?? '0'}>`,
                emoji: emoji.toString()
            })
        )
        .setFooter({ text: `EID: ${emoji.id}` })
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        self.logger.error({ module: 'LogsEmojiCreate', action: 'SendMessageViaWebhook', err, guildId: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: emoji.id,
        module: 'Logs',
        category: 'EmojiCreate'
    })

    return true
}

export interface EmojiCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.EmojiCreate>
}
