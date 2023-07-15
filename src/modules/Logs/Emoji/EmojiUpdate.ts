import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildEmoji } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildEmoji, emoji: GuildEmoji): Promise<boolean> {
    if (server.moderation.logs.types.emoji_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = emoji.guild.channels.cache.get(server.moderation.logs.types.emoji_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(emoji.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = emoji.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await emoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (before.name !== emoji.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.emoji_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.emoji_update_name_change_template', { emoji: `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('logs.before_change'), value: before.name },
                        { name: t('logs.after_change'), value: emoji.name }
                    ])
                    .setFooter({ text: emoji.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    self.logger.handleError({ module: 'LogsEmojiUpdateName', action: 'SendMessageViaWebhook', error: err, guild_id: emoji.guild.id })

                    return false
                }
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'EmojiUpdate',
                guild: { id: emoji.guild.id, name: emoji.guild.name },
                target: { id: emoji.id, name: emoji.name }
            })

            return true
        }
    }

    return false
}
