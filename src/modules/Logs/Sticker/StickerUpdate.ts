import { BaseGuildTextChannel, MessageEmbed, Sticker, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: Sticker, sticker: Sticker): Promise<boolean> {
    if (server.moderation.logs.types.sticker_update.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = sticker.guild.channels.cache.get(server.moderation.logs.types.sticker_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(sticker.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = sticker.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await sticker.guild.fetchAuditLogs({ limit: 1, type: 'STICKER_UPDATE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: sticker.guild.id },
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
                        reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.sticker_update.title)
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: sticker.guild.id },
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

            if (before.name != sticker.name) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.sticker_update.title)
                    .setDescription(
                        self.translator.format(
                            locale.logs.sticker_update.template,
                            `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`,
                            self.translator.format(locale.logs.sticker_update.types.name, `**${sticker.name}**`)
                        )
                    )
                    .addField(locale.logs.common.before_changes, before.name, true)
                    .addField(locale.logs.common.after_changes, sticker.name, true)
                    .setFooter({ text: sticker.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            self.emit('moduleExecution', {
                module: 'Logs: Sticker Update',
                guild: { id: sticker.guild.id, name: sticker.guild.name },
                target: { id: sticker.id, name: sticker.name }
            })

            return true
        }
    }

    return false
}
