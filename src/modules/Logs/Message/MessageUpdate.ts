import { BaseGuildTextChannel, EmbedBuilder, Message } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { truncateString } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, before: Message, message: Message): Promise<boolean> {
    if (server.moderation.logs.types.message_update.active) {
        if (isRateLimited(server._id, server.server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = message.guild.channels.cache.get(server.moderation.logs.types.message_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(message.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk && before.content !== message.content) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const before_content = truncateString(before.content ?? '', 800)
            const content = truncateString(message.content ?? '', 800)
            const attachment = message.attachments.first()

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.MessageUpdated'))
                .addFields([
                    { name: t('Logs.MessageAuthor'), value: `${message.author.tag}\n(${message.author.id})`, inline: true },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${message.channel.id}>`, inline: true },
                    { name: t('Logs.BeforeChange'), value: before_content || `\`[${t('Commands.OptionTypes.Attachment')}]\`` },
                    { name: t('Logs.AfterChange'), value: content || `\`[${t('Commands.OptionTypes.Attachment')}]\`` }
                ])
                .setFooter({ text: message.id })
                .setTimestamp()
                .setColor('#FFA726')

            if (attachment && attachment.height) embed.setImage(attachment.url)

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsMessageUpdate', action: 'SendMessageViaWebhook', error: err, guild_id: message.guildId })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'MessageUpdate',
                guild: { id: message.guild.id, name: message.guild.name },
                target: { id: message.author.id, name: message.author.tag }
            })

            return true
        }
    }

    return false
}
