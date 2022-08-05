import { BaseGuildTextChannel, MessageEmbed, ThreadChannel, Webhook } from 'discord.js'
import numbro from 'numbro'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, thread: ThreadChannel): Promise<boolean> {
    if (server.moderation.logs.types.thread_create.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = thread.guild.channels.cache.get(server.moderation.logs.types.thread_create.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(thread.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = thread.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG)
                ? await thread.guild.fetchAuditLogs({ limit: 1, type: 'THREAD_CREATE' })
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
                    webhook = await log.createWebhook(`${self.user.username}`, {
                        avatar: self.user.displayAvatarURL(),
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.thread_create_title') })
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

            const embed = new MessageEmbed()
                .setTitle(t('logs.thread_create_title'))
                .setDescription(t('logs.thread_create_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, thread: `<#${thread.id}>` }))
                .addField(t('common.channel'), thread.parent?.id ? `<#${thread.parentId}>` : '-', true)
                .addField(t('logs.thread_auto_archive_duration'), numbro((thread.autoArchiveDuration as number) * 60).format({ output: 'time' }), true)
                .setFooter({ text: thread.id })
                .setTimestamp()
                .setColor('#2FDF84')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', {
                module: 'Logs: Thread Create',
                guild: { id: thread.guild.id, name: thread.guild.name },
                target: { id: thread.id, name: thread.name }
            })

            return true
        }
    }

    return false
}
