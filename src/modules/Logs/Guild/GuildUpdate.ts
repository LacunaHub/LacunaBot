import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Guild } from 'discord.js'
import numbro from 'numbro'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: Guild, guild: Guild): Promise<boolean> {
    if (server.moderation.logs.types.guild_update.active) {
        if (isRateLimited(server._id, server.server.premium.available)) return false

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
                    .setTitle(t('Logs.GuildUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.GuildUpdatedName')
                        })
                    )
                    .addFields([
                        { name: t('Logs.BeforeChange'), value: before.name, inline: true },
                        { name: t('Logs.AfterChange'), value: guild.name, inline: true }
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
                    .setTitle(t('Logs.GuildUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.GuildUpdatedAFKChannel')
                        })
                    )
                    .addFields([
                        { name: t('Logs.BeforeChange'), value: before.afkChannel?.name ?? '-', inline: true },
                        { name: t('Logs.AfterChange'), value: guild.afkChannel?.name ?? '-', inline: true }
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
                    .setTitle(t('Logs.GuildUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.GuildUpdatedAFKTimeout')
                        })
                    )
                    .addFields([
                        {
                            name: t('Logs.BeforeChange'),
                            value: before.afkTimeout ? numbro(before.afkTimeout).format({ output: 'time' }) : '-',
                            inline: true
                        },
                        {
                            name: t('Logs.AfterChange'),
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
                    .setTitle(t('Logs.GuildUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.GuildUpdatedDescription')
                        })
                    )
                    .addFields([
                        { name: t('Logs.BeforeChange'), value: before.description ?? '-', inline: true },
                        { name: t('Logs.AfterChange'), value: guild.description ?? '-', inline: true }
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
