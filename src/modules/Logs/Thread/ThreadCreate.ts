import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, ThreadChannel } from 'discord.js'
import numbro from 'numbro'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, thread: ThreadChannel): Promise<boolean> {
    if (server.moderation.logs.types.thread_create.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = thread.guild.channels.cache.get(server.moderation.logs.types.thread_create.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(thread.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const audit = thread.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await thread.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.ThreadCreate })
                : null
            const entry = audit?.entries?.find(v => v.targetId === thread.id)
            const executor = entry?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.ThreadCreated'))
                .setDescription(t('Logs.ThreadCreatedTemplate', { username: `<@${executor?.id ?? '0'}>`, thread: `<#${thread.id}>` }))
                .addFields([
                    { name: t('Commands.OptionTypes.Channel'), value: thread.parent?.id ? `<#${thread.parentId}>` : '-', inline: true },
                    {
                        name: t('Logs.ThreadAutoArchiveTime'),
                        value: numbro((thread.autoArchiveDuration as number) * 60).format({ output: 'time' }),
                        inline: true
                    }
                ])
                .setFooter({ text: `TID: ${thread.id}` })
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
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
