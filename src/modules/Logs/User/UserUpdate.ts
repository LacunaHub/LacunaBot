import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, EmbedBuilder, Guild, User } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, guild: Guild, before: User, user: User): Promise<boolean> {
    if (server.moderation.logs.types.user_update.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = guild.channels.cache.get(server.moderation.logs.types.user_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            if (before.username !== user.username) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.UserUpdated'))
                    .setDescription(t('Logs.UserUpdatedName', { username: `**${user.tag}**` }))
                    .addFields([
                        { name: t('Logs.BeforeChange'), value: before.username, inline: true },
                        { name: t('Logs.AfterChange'), value: user.username, inline: true }
                    ])
                    .setFooter({ text: user.id })
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
                        module: 'LogsUserUpdateUsername',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: guild.id
                    })

                    return false
                }
            }

            if (before.discriminator !== user.discriminator) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.UserUpdated'))
                    .setDescription(t('Logs.UserUpdatedDiscriminator', { username: `**${user.tag}**` }))
                    .addFields([
                        { name: t('Logs.BeforeChange'), value: before.discriminator, inline: true },
                        { name: t('Logs.AfterChange'), value: user.discriminator, inline: true }
                    ])
                    .setFooter({ text: user.id })
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
                        module: 'LogsUserUpdateDiscriminator',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: guild.id
                    })

                    return false
                }
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'UserUpdate',
                guild: { id: guild.id, name: guild.name },
                target: { id: user.username, name: user.id }
            })

            return true
        }
    }

    return false
}
