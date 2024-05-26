import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildEmoji } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, emoji: GuildEmoji): Promise<boolean> {
    if (server.moderation.logs.types.emoji_create.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = emoji.guild.channels.cache.get(server.moderation.logs.types.emoji_create.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(emoji.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = emoji.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await emoji.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.EmojiCreate })
                : null
            const entry = audit?.entries?.find(v => v.targetId === emoji.id)
            const executor = entry?.executor

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
                await webhook.send({ embeds: [embed] })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsEmojiCreate', action: 'SendMessageViaWebhook', error: err, guild_id: emoji.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'EmojiCreate',
                guild: { id: emoji.guild.id, name: emoji.guild.name },
                target: { id: emoji.id, name: emoji.name }
            })

            return true
        }
    }

    return false
}
