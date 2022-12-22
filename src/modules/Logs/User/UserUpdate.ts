import { BaseGuildTextChannel, EmbedBuilder, Guild, User, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, guild: Guild, before: User, user: User): Promise<boolean> {
    if (server.moderation.logs.types.user_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = guild.channels.cache.get(server.moderation.logs.types.user_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: guild.id },
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.user_update_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: guild.id },
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

            if (before.username != user.username) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.user_update_title'))
                    .setDescription(t('logs.user_update_name_change_template', { user: `**${user.tag}**` }))
                    .addFields([
                        { name: t('logs.before_change'), value: before.username, inline: true },
                        { name: t('logs.after_change'), value: user.username, inline: true }
                    ])
                    .setFooter({ text: user.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.discriminator != user.discriminator) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.user_update_title'))
                    .setDescription(t('logs.user_update_discriminator_change_template', { user: `**${user.tag}**` }))
                    .addFields([
                        { name: t('logs.before_change'), value: before.discriminator, inline: true },
                        { name: t('logs.after_change'), value: user.discriminator, inline: true }
                    ])
                    .setFooter({ text: user.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            self.emit('moduleExecution', { module: 'Logs: User Update', guild: { id: guild.id, name: guild.name }, target: { id: user.username, name: user.id } })

            return true
        }
    }

    return false
}
