import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Sticker } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: Sticker, sticker: Sticker): Promise<boolean> {
    if (server.moderation.logs.types.sticker_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = sticker.guild.channels.cache.get(server.moderation.logs.types.sticker_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(sticker.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = sticker.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await sticker.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.StickerUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (before.name !== sticker.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.sticker_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.sticker_update_name_change_template', { sticker: `**${sticker.name}**` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.name, inline: true },
                        { name: t('logs.after_change'), value: sticker.name, inline: true }
                    ])
                    .setFooter({ text: sticker.id })
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
                        module: 'LogsStickerUpdateName',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: sticker.guildId
                    })

                    return false
                }
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'StickerUpdate',
                guild: { id: sticker.guild.id, name: sticker.guild.name },
                target: { id: sticker.id, name: sticker.name }
            })

            return true
        }
    }

    return false
}
