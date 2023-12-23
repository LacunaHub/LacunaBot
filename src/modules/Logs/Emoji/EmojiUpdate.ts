import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildEmoji } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildEmoji, emoji: GuildEmoji): Promise<boolean> {
    if (server.moderation.logs.types.emoji_update.active) {
        if (isRateLimited(server._id, server.server.premium.available)) return false

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
                    .setTitle(t('Logs.EmojiUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.EmojiUpdatedName', { emoji: `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` })
                        })
                    )
                    .setFields([
                        { name: t('Logs.BeforeChange'), value: before.name },
                        { name: t('Logs.AfterChange'), value: emoji.name }
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
                guild: { id: emoji.guild.id, name: emoji.guild.name },
                target: { id: emoji.id, name: emoji.name }
            })

            return true
        }
    }

    return false
}
