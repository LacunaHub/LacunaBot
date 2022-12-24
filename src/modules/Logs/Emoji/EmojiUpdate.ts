import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildEmoji, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildEmoji, emoji: GuildEmoji): Promise<boolean> {
    if (server.moderation.logs.types.emoji_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = emoji.guild.channels.cache.get(server.moderation.logs.types.emoji_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(emoji.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = emoji.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await emoji.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: emoji.guild.id },
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.emoji_update_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: emoji.guild.id },
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

            if (before.name != emoji.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.emoji_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.emoji_update_name_change_template', { emoji: `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.name },
                        { name: t('logs.after_change'), value: emoji.name }
                    ])
                    .setFooter({ text: emoji.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'EmojiUpdate',
                guild: { id: emoji.guild.id, name: emoji.guild.name },
                target: { id: emoji.id, name: emoji.name }
            })

            return true
        }
    }

    return false
}
