import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, ThreadChannel } from 'discord.js'
import numbro from 'numbro'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: ThreadChannel, thread: ThreadChannel): Promise<boolean> {
    if (server.moderation.logs.types.thread_update.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = thread.guild.channels.cache.get(server.moderation.logs.types.thread_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(thread.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = thread.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await thread.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.ThreadUpdate })
                : null
            const entry = audit?.entries?.find(v => v.targetId === thread.id)
            const executor = entry?.executor

            if (before.name !== thread.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.ThreadUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.ThreadUpdatedName', { thread: `<#${thread.id}>` })
                        })
                    )
                    .addFields([
                        { name: t('Logs.BeforeChange'), value: before.name, inline: true },
                        { name: t('Logs.AfterChange'), value: thread.name, inline: true }
                    ])
                    .setFooter({ text: thread.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsThreadUpdateName',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: thread.guildId
                    })

                    return false
                }
            }

            if (before.autoArchiveDuration !== thread.autoArchiveDuration) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.ThreadUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.ThreadUpdatedAutoArchive', { thread: `<#${thread.id}>` })
                        })
                    )
                    .addFields([
                        {
                            name: t('Logs.BeforeChange'),
                            value: numbro((before.autoArchiveDuration as number) * 60).format({ output: 'time' }),
                            inline: true
                        },
                        {
                            name: t('Logs.AfterChange'),
                            value: numbro((thread.autoArchiveDuration as number) * 60).format({ output: 'time' }),
                            inline: true
                        }
                    ])
                    .setFooter({ text: thread.id })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsThreadUpdateAutoArchiveDuration',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: thread.guildId
                    })

                    return false
                }
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'ThreadUpdate',
                guild: { id: thread.guild.id, name: thread.guild.name },
                target: { id: thread.id, name: thread.name }
            })

            return true
        }
    }

    return false
}
