import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildEmoji } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, emoji: GuildEmoji): Promise<boolean> {
    if (server.moderation.logs.types.emoji_delete.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = emoji.guild.channels.cache.get(server.moderation.logs.types.emoji_delete.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(emoji.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = emoji.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await emoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiDelete })
                : null
            const executor = audit?.entries?.first()?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('logs.emoji_delete_title'))
                .setDescription(
                    t('logs.emoji_delete_template', {
                        user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                        emoji: `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`
                    })
                )
                .setFooter({ text: emoji.id })
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsEmojiDelete', action: 'SendMessageViaWebhook', error: err, guild_id: emoji.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'EmojiDelete',
                guild: { id: emoji.guild.id, name: emoji.guild.name },
                target: { id: emoji.id, name: emoji.name }
            })

            return true
        }
    }

    return false
}
