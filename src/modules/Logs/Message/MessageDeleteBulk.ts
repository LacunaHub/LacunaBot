import { BaseGuildTextChannel, Collection, EmbedBuilder, Message } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { truncateString } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, messages: Collection<string, Message>): Promise<boolean> {
    if (server.moderation.logs.types.message_delete_bulk.active) {
        if (isRateLimited(server._id) && !server.server.premium.available) return false

        const t = self.i18n.t.bind(null, server.locale)
        const message = messages.first()

        const logChannel = message.guild.channels.cache.get(server.moderation.logs.types.message_delete_bulk.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(message.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

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
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({
                    module: 'LogsMessageDeleteBulk',
                    action: 'SendMessageViaWebhook',
                    error: err,
                    guild_id: message.guildId
                })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'MessageDeleteBulk',
                guild: { id: message.guild.id, name: message.guild.name },
                target: { id: message.author ? message.author.id : message.id, name: message.author ? message.author.tag : message.type }
            })

            return true
        }
    }

    return false
}
