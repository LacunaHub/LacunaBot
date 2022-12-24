import { BaseGuildTextChannel, Collection, EmbedBuilder, Message, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { truncateString } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, messages: Collection<string, Message>): Promise<boolean> {
    if (server.moderation.logs.types.message_delete_bulk.active) {
        const t = self.i18n.t.bind(null, server.locale)
        const message = messages.first()

        const log = message.guild.channels.cache.get(server.moderation.logs.types.message_delete_bulk.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(message.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

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
                    webhook = await log.createWebhook({
                        name: self.user.username,
                        avatar: self.user.displayAvatarURL(),
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.message_delete_bulk_title') })
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

            const embed = new EmbedBuilder()
                .setTitle(t('logs.message_delete_bulk_title'))
                .addFields([
                    { name: t('logs.message_count'), value: messages.size.toString(), inline: true },
                    { name: t('common.channel'), value: `<#${message.channel.id}>`, inline: true },
                    ...messages.first(10).map(i => ({
                        name: `${i.author?.tag ?? '???'} <t:${Math.round(i.createdTimestamp / 1000)}:R>`,
                        value: truncateString(i.content || `\`[${t('common.attachment')}]\``, 100)
                    }))
                ])
                .setTimestamp()
                .setColor('#EF5350')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

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
