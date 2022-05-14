import { BaseGuildTextChannel, Message, MessageEmbed, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { truncateString } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, before: Message, message: Message): Promise<boolean> {
    if (server.moderation.logs.types.message_update.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = message.guild.channels.cache.get(server.moderation.logs.types.message_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(message.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok && before.content != message.content) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: message.guild.id },
                        {
                            $pull: {
                                'moderation.logs.webhooks': {
                                    channel_id: log.id
                                }
                            }
                        }
                    )
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, {
                        avatar: self.user.displayAvatarURL(),
                        reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_update.title)
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: message.guild.id },
                    {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelId
                            }
                        }
                    }
                )
            }

            const before_content = truncateString(before.content ?? '', 800)
            const content = truncateString(message.content ?? '', 800)
            const attachment = message.attachments.first()

            const embed = new MessageEmbed()
                .setTitle(locale.logs.message_update.title)
                .addField(locale.logs.common.sender, `${message.author.tag}\n(${message.author.id})`, true)
                .addField(locale.logs.common.channel, `<#${message.channel.id}>`, true)
                .addField(locale.logs.common.before_changes, before_content || `\`[${locale.logs.message_delete.attachment}]\``)
                .addField(locale.logs.common.after_changes, content || `\`[${locale.logs.message_delete.attachment}]\``)
                .setFooter({ text: message.id })
                .setTimestamp()
                .setColor('#FFA726')

            if (attachment && attachment.height) embed.setImage(attachment.url)

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', {
                module: 'Logs: Message Update',
                guild: { id: message.guild.id, name: message.guild.name },
                target: { id: message.author.id, name: message.author.tag }
            })

            return true
        }
    }

    return false
}
