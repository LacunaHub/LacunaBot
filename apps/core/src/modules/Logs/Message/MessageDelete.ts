import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { truncateString } from '@/internals/utility/Utils.js'
import { BaseGuildTextChannel, EmbedBuilder, Message } from 'discord.js'
import { isRateLimited, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, message: Message<true>): Promise<boolean> {
    if (server.moderation.logs.types.message_delete.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = message.guild.channels.cache.get(
            server.moderation.logs.types.message_delete.channel_id!
        ) as BaseGuildTextChannel
        const isOk =
            logChannel && logChannel.permissionsFor(message.guild.members.me!).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const content = truncateString(message.content ?? '', 800)
            const attachment = message.attachments.first()

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.MessageDeleted'))
                .addFields([
                    {
                        name: t('Logs.MessageAuthor'),
                        value: `<@${message.author.id}> (${message.author.username})`,
                        inline: true
                    },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${message.channel.id}>`, inline: true },
                    {
                        name: t('Logs.MessageContent'),
                        value: content || `\`[${t('Commands.OptionTypes.Attachment')}]\``
                    }
                ])
                .setFooter({ text: `MID: ${message.id}` })
                .setTimestamp()
                .setColor('#EF5350')

            if (attachment && attachment.height) embed.setImage(attachment.proxyURL)

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({
                    module: 'LogsMessageDelete',
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
                category: 'MessageDelete'
            })

            return true
        }
    }

    return false
}
