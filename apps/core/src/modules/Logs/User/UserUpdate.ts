import { ServerDocument } from '@/database/schemas/Servers'
import { BaseGuildTextChannel, EmbedBuilder, Guild, User } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, guild: Guild, before: User, user: User): Promise<boolean> {
    if (server.moderation.logs.types.user_update.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = guild.channels.cache.get(server.moderation.logs.types.user_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            if (before.username !== user.username) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.UserUpdated'))
                    .setDescription(t('Logs.UserUpdatedName', { username: `<@${user.id}> (${user.tag})` }))
                    .addFields([
                        { name: t('Logs.BeforeChange'), value: before.username, inline: true },
                        { name: t('Logs.AfterChange'), value: user.username, inline: true }
                    ])
                    .setFooter({ text: `UID: ${user.id}` })
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await sendLog(self, server, logChannel.id, { embeds: [embed] })
                } catch (err) {
                    self.logger.error({
                        module: 'LogsUserUpdateUsername',
                        action: 'SendMessageViaWebhook',
                        err,
                        guildId: guild.id
                    })

                    return false
                }
            }

            self.emit('moduleExecution', {
                guildId: guild.id,
                targetId: user.id,
                module: 'Logs',
                category: 'UserUpdate'
            })

            return true
        }
    }

    return false
}
