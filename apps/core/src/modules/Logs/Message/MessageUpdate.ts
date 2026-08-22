import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { DiffMatchPatch } from '@/internals/utility/DiffMatchPatch.js'
import { truncateString } from '@/internals/utility/Utils.js'
import { BaseGuildTextChannel, EmbedBuilder, Message, escapeMarkdown } from 'discord.js'
import { isRateLimited, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    before: Message,
    message: Message<true>
): Promise<boolean> {
    if (server.moderation.logs.types.message_update.active) {
        if (isRateLimited(server._id)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = message.guild.channels.cache.get(
            server.moderation.logs.types.message_update.channel_id!
        ) as BaseGuildTextChannel
        const isOk =
            logChannel && logChannel.permissionsFor(message.guild.members.me!).has(self.PermissionFlags.ManageWebhooks)

        if (isOk && before.content !== message.content) {
            const contentBefore = truncateString(escapeMarkdown(before.content ?? ''), 800),
                content = truncateString(escapeMarkdown(message.content ?? ''), 800)
            const dmp = new DiffMatchPatch(),
                diff = dmp.prettyMarkdown(dmp.main(contentBefore, content))
            const attachment = message.attachments.first()

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.MessageUpdated'))
                .addFields([
                    {
                        name: t('Logs.MessageAuthor'),
                        value: `<@${message.author.id}> (${message.author.username})`,
                        inline: true
                    },
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
                self.logger.error({
                    module: 'LogsMessageUpdate',
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
                category: 'MessageUpdate'
            })

            return true
        }
    }

    return false
}
