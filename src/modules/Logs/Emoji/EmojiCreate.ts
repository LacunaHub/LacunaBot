import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, LogEventData, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, data: EmojiCreateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.emoji_create.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const emoji = guild.emojis.cache.get(auditLogEntry.targetId),
        executor = auditLogEntry.executor

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.emoji_create.channel_id)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

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
        await self.logger.handleError({ module: 'LogsEmojiCreate', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'EmojiCreate',
        guild: { id: guild.id, name: guild.name },
        target: { id: emoji.id, name: emoji.id }
    })

    return true
}

export interface EmojiCreateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.EmojiCreate>
}
