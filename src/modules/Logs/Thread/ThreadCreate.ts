import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, ThreadChannel } from 'discord.js'
import numbro from 'numbro'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, thread: ThreadChannel): Promise<boolean> {
    if (server.moderation.logs.types.thread_create.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = thread.guild.channels.cache.get(server.moderation.logs.types.thread_create.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(thread.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = thread.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await thread.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ThreadCreate })
                : null
            const executor = audit?.entries?.first()?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('logs.thread_create_title'))
                .setDescription(
                    t('logs.thread_create_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, thread: `<#${thread.id}>` })
                )
                .addFields([
                    { name: t('common.channel'), value: thread.parent?.id ? `<#${thread.parentId}>` : '-', inline: true },
                    {
                        name: t('logs.thread_auto_archive_duration'),
                        value: numbro((thread.autoArchiveDuration as number) * 60).format({ output: 'time' }),
                        inline: true
                    }
                ])
                .setFooter({ text: thread.id })
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsThreadCreate', action: 'SendMessageViaWebhook', error: err, guild_id: thread.guildId })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'ThreadCreate',
                guild: { id: thread.guild.id, name: thread.guild.name },
                target: { id: thread.id, name: thread.name }
            })

            return true
        }
    }

    return false
}
