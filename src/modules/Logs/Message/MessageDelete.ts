import { BaseGuildTextChannel, Message, MessageEmbed, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { truncateString } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, message: Message): Promise<boolean> {
    if (server.moderation.logs.types.message_delete.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = message.guild.channels.cache.get(server.moderation.logs.types.message_delete.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(message.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.message_delete_title') })
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

            const content = truncateString(message.content ?? '', 800)
            const attachment = message.attachments.first()

            const embed = new MessageEmbed()
                .setTitle(t('logs.message_delete_title'))
                .addFields([
                    { name: t('logs.message_author'), value: `${message.author.tag}\n(${message.author.id})`, inline: true },
                    { name: t('common.channel'), value: `<#${message.channel.id}>`, inline: true },
                    { name: t('logs.message_content'), value: content || `\`[${t('common.attachment')}]\``, inline: true }
                ])
                .setFooter({ text: message.id })
                .setTimestamp()
                .setColor('#EF5350')

            if (attachment && attachment.height) embed.setImage(attachment.proxyURL)

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', {
                module: 'Logs: Message Delete',
                guild: { id: message.guild.id, name: message.guild.name },
                target: { id: message.author.id, name: message.author.tag }
            })

            return true
        }
    }

    return false
}
