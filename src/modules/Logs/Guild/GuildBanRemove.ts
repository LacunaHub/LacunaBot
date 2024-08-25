import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildAuditLogsEntry, GuildBan } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'
import { capitalizeFirstLetter } from '../../../internals/utility/Utils'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    ban: GuildBan,
    auditLogsEntry: GuildAuditLogsEntry<AuditLogEvent.MemberBanRemove, 'Create', 'User', AuditLogEvent.MemberBanRemove>
): Promise<boolean> {
    if (!server.moderation.logs.types.guild_ban_remove.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const guild = ban.guild,
        user = ban.user

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_ban_remove.channel_id) as BaseGuildTextChannel
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const embed = new EmbedBuilder()
        .setTitle(t('Logs.GuildBanRemoved'))
        .setDescription(
            t('Logs.GuildBanRemovedTemplate', {
                username: `<@${auditLogsEntry?.executor?.id ?? '0'}>`,
                target: `<@${user.id}> (${user.tag})`
            })
        )
        .addFields([{ name: capitalizeFirstLetter(t('Commands.Options.Reason')), value: auditLogsEntry?.reason ?? '-' }])
        .setTimestamp()
        .setColor('#2FDF84')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({ module: 'LogsGuildBanRemove', action: 'SendMessageViaWebhook', error: err, guild_id: guild.id })

        return false
    }

    self.emit('moduleExecution', {
        module: 'Logs',
        category: 'GuildBanRemove',
        guild: { id: guild.id, name: guild.name },
        target: { id: user.id, name: user.tag }
    })

    return true
}
