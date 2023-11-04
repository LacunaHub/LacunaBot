import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Guild } from 'discord.js'
import numbro from 'numbro'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: Guild, guild: Guild): Promise<boolean> {
    if (server.moderation.logs.types.guild_update.active) {
        if (isRateLimited(server._id) && !server.server.premium.available) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (before.name !== guild.name) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.guild_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.guild_update_name_change')
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.name, inline: true },
                        { name: t('logs.after_change'), value: guild.name, inline: true }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({ module: 'LogsGuildUpdateName', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

                    return false
                }
            }

            if (before.afkChannelId !== guild.afkChannelId) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.guild_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.guild_update_afk_channel_change')
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.afkChannel?.name ?? '-', inline: true },
                        { name: t('logs.after_change'), value: guild.afkChannel?.name ?? '-', inline: true }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsGuildUpdateAfkChannel',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: guild.id
                    })

                    return false
                }
            }

            if (before.afkTimeout !== guild.afkTimeout) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.guild_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.guild_update_afk_timeout_change')
                        })
                    )
                    .addFields([
                        {
                            name: t('logs.before_change'),
                            value: before.afkTimeout ? numbro(before.afkTimeout).format({ output: 'time' }) : '-',
                            inline: true
                        },
                        {
                            name: t('logs.after_change'),
                            value: guild.afkTimeout ? numbro(guild.afkTimeout).format({ output: 'time' }) : '-',
                            inline: true
                        }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsGuildUpdateAfkTimeout',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: guild.id
                    })

                    return false
                }
            }

            if (before.description !== guild.description) {
                const embed = new EmbedBuilder()
                    .setTitle(t('logs.guild_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.guild_update_description_change')
                        })
                    )
                    .addFields([
                        { name: t('logs.before_change'), value: before.description ?? '-', inline: true },
                        { name: t('logs.after_change'), value: guild.description ?? '-', inline: true }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await webhook.send({
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        username: server.server.premium.available ? webhook.name : self.user.username
                    })
                } catch (err) {
                    await self.logger.handleError({
                        module: 'LogsGuildUpdateDescription',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: guild.id
                    })

                    return false
                }
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'GuildUpdate',
                guild: { id: guild.id, name: guild.name },
                target: { id: guild.id, name: guild.name }
            })

            return true
        }
    }

    return false
}
