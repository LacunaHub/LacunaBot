import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, ThreadChannel } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, thread: ThreadChannel): Promise<boolean> {
    if (server.moderation.logs.types.thread_delete.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = thread.guild.channels.cache.get(server.moderation.logs.types.thread_delete.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(thread.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = thread.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await thread.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.ThreadDelete })
                : null
            const entry = audit?.entries?.find(v => v.targetId === thread.id)
            const executor = entry?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.ThreadDeleted'))
                .setDescription(
                    t('Logs.ThreadDeletedTemplate', { username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`, thread: `**${thread.name}**` })
                )
                .addFields([{ name: t('Commands.OptionTypes.Channel'), value: thread.parent?.id ? `<#${thread.parentId}>` : '-', inline: true }])
                .setFooter({ text: thread.id })
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsThreadDelete', action: 'SendMessageViaWebhook', error: err, guild_id: thread.guildId })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'ThreadDelete',
                guild: { id: thread.guild.id, name: thread.guild.name },
                target: { id: thread.id, name: thread.name }
            })

            return true
        }
    }

    return false
}
