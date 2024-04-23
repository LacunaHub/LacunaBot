import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Sticker } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, sticker: Sticker): Promise<boolean> {
    if (server.moderation.logs.types.sticker_delete.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = sticker.guild.channels.cache.get(server.moderation.logs.types.sticker_delete.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(sticker.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = sticker.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await sticker.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.StickerDelete })
                : null
            const entry = audit?.entries?.find(v => v.targetId === sticker.id)
            const executor = entry?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.StickerDeleted'))
                .setDescription(
                    t('Logs.StickerDeletedTemplate', { username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`, sticker: `**${sticker.name}**` })
                )
                .setFooter({ text: sticker.id })
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsStickerDelete', action: 'SendMessageViaWebhook', error: err, guild_id: sticker.guildId })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'StickerDelete',
                guild: { id: sticker.guild.id, name: sticker.guild.name },
                target: { id: sticker.id, name: sticker.name }
            })

            return true
        }
    }

    return false
}
