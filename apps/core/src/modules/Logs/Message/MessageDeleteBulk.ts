import { ServerDocument } from '@/database/schemas/Servers'
import { BaseGuildTextChannel, Collection, EmbedBuilder, Message } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'
import { truncateString } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, messages: Collection<string, Message>): Promise<boolean> {
    if (server.moderation.logs.types.message_delete_bulk.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)
        const message = messages.first()

        const logChannel = message.guild.channels.cache.get(server.moderation.logs.types.message_delete_bulk.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(message.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.MessageDeletedBulk'))
                .addFields([
                    { name: t('Logs.MessageCount'), value: messages.size.toString(), inline: true },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${message.channel.id}>`, inline: true },
                    ...messages.first(10).map(i => ({
                        name: `${i.author?.tag ?? '???'} <t:${Math.round(i.createdTimestamp / 1000)}:R>`,
                        value: truncateString(i.content || `\`[${t('Commands.OptionTypes.Attachment')}]\``, 100)
                    }))
                ])
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({
                    module: 'LogsMessageDeleteBulk',
                    action: 'SendMessageViaWebhook',
                    err,
                    guildId: message.guildId
                })

                return false
            }

            self.emit('moduleExecution', {
                guildId: message.guildId,
                targetId: message.id,
                module: 'Logs',
                category: 'MessageDeleteBulk'
            })

            return true
        }
    }

    return false
}
