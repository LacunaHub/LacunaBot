import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, ThreadChannel, Webhook } from 'discord.js'
import numbro from 'numbro'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: ThreadChannel, thread: ThreadChannel): Promise<boolean> {
    if (server.moderation.logs.types.thread_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = thread.guild.channels.cache.get(server.moderation.logs.types.thread_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(thread.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = thread.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await thread.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ThreadUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: thread.guild.id },
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.thread_update_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: thread.guild.id },
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

            if (before.name != thread.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.thread_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.thread_update_name_change_template', { user: `<#${thread.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.name, inline: true },
                        { name: t('logs.after_change'), value: thread.name, inline: true }
                    ])
                    .setFooter({ text: thread.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.autoArchiveDuration != thread.autoArchiveDuration) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.thread_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.thread_update_auto_archive_change_template', { user: `<#${thread.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: numbro((before.autoArchiveDuration as number) * 60).format({ output: 'time' }), inline: true },
                        { name: t('logs.after_change'), value: numbro((thread.autoArchiveDuration as number) * 60).format({ output: 'time' }), inline: true }
                    ])
                    .setFooter({ text: thread.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            self.emit('moduleExecution', {
                module: 'Logs: Thread Update',
                guild: { id: thread.guild.id, name: thread.guild.name },
                target: { id: thread.id, name: thread.name }
            })

            return true
        }
    }

    return false
}
