import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Sticker } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: Sticker, sticker: Sticker): Promise<boolean> {
    if (server.moderation.logs.types.sticker_update.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = sticker.guild.channels.cache.get(server.moderation.logs.types.sticker_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(sticker.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const audit = sticker.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await sticker.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.StickerUpdate })
                : null
            const entry = audit?.entries?.find(v => v.targetId === sticker.id)
            const executor = entry?.executor

            if (before.name !== sticker.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.StickerUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `<@${executor?.id ?? '0'}>`,
                            change: t('Logs.StickerUpdatedName', { sticker: `**${sticker.name}**` })
                        })
                    )
                    .addFields([
                        { name: t('Logs.BeforeChange'), value: before.name, inline: true },
                        { name: t('Logs.AfterChange'), value: sticker.name, inline: true }
                    ])
                    .setFooter({ text: `SID: ${sticker.id}` })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await sendLog(self, server, logChannel.id, { embeds: [embed] })
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
