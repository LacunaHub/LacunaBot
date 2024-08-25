import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildAuditLogsEntry, GuildBan } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'
import { capitalizeFirstLetter } from '../../../internals/utility/Utils'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    ban: GuildBan,
    auditLogsEntry: GuildAuditLogsEntry<AuditLogEvent.MemberBanAdd, 'Delete', 'User', AuditLogEvent.MemberBanAdd>
): Promise<boolean> {
    if (!server.moderation.logs.types.guild_ban_add.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const guild = ban.guild,
        user = ban.user
    const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_ban_add.channel_id) as BaseGuildTextChannel
    if (!logChannel || !logChannel.permissionsFor(guild.members.me).has(self.PermissionFlags.ManageWebhooks)) return false

    const executor = auditLogsEntry?.executor
    const embed = new EmbedBuilder()
        .setTitle(t('Logs.GuildBanAdded'))
        .setDescription(
            t('Logs.GuildBanAddedTemplate', {
                username: `<@${executor?.id ?? '0'}> (${executor?.tag ?? 'unknown'})`,
                target: `<@${user.id}> (${user.tag})`
            })
        )
        .addFields([{ name: capitalizeFirstLetter(t('Commands.Options.Reason')), value: ban.reason ?? '-' }])
        .setTimestamp()
        .setColor('#EF5350')

    try {
        await sendLog(self, server, logChannel.id, { embeds: [embed] })
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
