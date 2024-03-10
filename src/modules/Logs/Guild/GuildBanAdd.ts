import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, Guild, User } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'
import { capitalizeFirstLetter } from '../../../internals/utility/Utils'

export default async function (self: Lacuna, server: ServerDocument, guild: Guild, user: User): Promise<boolean> {
    if (server.moderation.logs.types.guild_ban_add.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_ban_add.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })
                : null
            const executor = audit?.entries?.first()?.executor
            const reason = audit?.entries?.first()?.reason

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.GuildBanAdded'))
                .setDescription(
                    t('Logs.GuildBanAddedTemplate', {
                        username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                        target: `**${user.tag}** (${user.id})`
                    })
                )
                .addFields([{ name: capitalizeFirstLetter(t('Commands.Options.Reason')), value: reason ?? '-' }])
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsGuildBanAdd', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'GuildBanAdd',
                guild: { id: guild.id, name: guild.name },
                target: { id: user.id, name: user.tag }
            })

            return true
        }
    }

    return false
}
