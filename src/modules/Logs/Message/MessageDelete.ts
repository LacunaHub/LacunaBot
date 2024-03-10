import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, EmbedBuilder, Message } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'
import { truncateString } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, message: Message): Promise<boolean> {
    if (server.moderation.logs.types.message_delete.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = message.guild.channels.cache.get(server.moderation.logs.types.message_delete.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(message.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const content = truncateString(message.content ?? '', 800)
            const attachment = message.attachments.first()

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.MessageDeleted'))
                .addFields([
                    { name: t('Logs.MessageAuthor'), value: `${message.author.tag}\n(${message.author.id})`, inline: true },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${message.channel.id}>`, inline: true },
                    { name: t('Logs.MessageContent'), value: content || `\`[${t('Commands.OptionTypes.Attachment')}]\``, inline: true }
                ])
                .setFooter({ text: message.id })
                .setTimestamp()
                .setColor('#EF5350')

            if (attachment && attachment.height) embed.setImage(attachment.proxyURL)

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsMessageDelete', action: 'SendMessageViaWebhook', error: err, guild_id: message.guildId })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'MessageDelete',
                guild: { id: message.guild.id, name: message.guild.name },
                target: { id: message.author.id, name: message.author.tag }
            })

            return true
        }
    }

    return false
}
