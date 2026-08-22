import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, data: EmojiUpdateLogEventData): Promise<boolean> {
    if (!server.moderation.logs.types.emoji_update.active) return false
    if (isRateLimited(server._id)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const emoji = guild.emojis.cache.get(auditLogEntry.targetId!)!,
        executor = auditLogEntry.executor

    const logChannel = emoji.guild.channels.cache.get(server.moderation.logs.types.emoji_update.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

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
            self.logger.error({
                module: 'LogsEmojiUpdateName',
                action: 'SendMessageViaWebhook',
                err,
                guildId: emoji.guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: emoji.id,
        module: 'Logs',
        category: 'EmojiUpdate'
    })

    return true
}

export interface EmojiUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.EmojiUpdate>
}
