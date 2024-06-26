import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, EmbedBuilder, Message, escapeMarkdown } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'
import { DiffMatchPatch } from '../../../internals/utility/DiffMatchPatch'
import { truncateString } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, before: Message, message: Message): Promise<boolean> {
    if (server.moderation.logs.types.message_update.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = message.guild.channels.cache.get(server.moderation.logs.types.message_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(message.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk && before.content !== message.content) {
            const contentBefore = truncateString(escapeMarkdown(before.content ?? ''), 800),
                content = truncateString(escapeMarkdown(message.content ?? ''), 800)
            const dmp = new DiffMatchPatch(),
                diff = dmp.prettyMarkdown(dmp.main(contentBefore, content))
            const attachment = message.attachments.first()

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.MessageUpdated'))
                .addFields([
                    { name: t('Logs.MessageAuthor'), value: `<@${message.author.id}> (${message.author.username})`, inline: true },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${message.channel.id}>`, inline: true },
                    { name: t('Logs.MessageContent'), value: diff || `\`[${t('Commands.OptionTypes.Attachment')}]\`` }
                ])
                .setFooter({ text: `MID: ${message.id}` })
                .setTimestamp()
                .setColor('#FFA726')

            if (attachment && attachment.height) embed.setImage(attachment.url)

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
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
