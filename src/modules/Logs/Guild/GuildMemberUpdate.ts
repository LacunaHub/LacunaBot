import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildMember } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildMember, member: GuildMember): Promise<boolean> {
    if (server.moderation.logs.types.guild_member_update.active) {
        if (isRateLimited(server._id) && !server.server.premium.available) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(member.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = member.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (before.displayName !== member.displayName) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.GuildMemberUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `**${executor?.tag ?? t('Logs.UnknownUser')}**`,
                            change: t('Logs.GuildMemberUpdatedNickname', { username: `**${member.user.tag}** (${member.id})` })
                        })
                    )
                    .setFields([
                        { name: t('Logs.BeforeChange'), value: before.displayName, inline: true },
                        { name: t('Logs.AfterChange'), value: member.displayName, inline: true }
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
                        module: 'LogsGuildMemberUpdateName',
                        action: 'SendMessageViaWebhook',
                        error: err,
                        guild_id: member.guild.id
                    })

                    return false
                }
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'GuildMemberUpdate',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })

            return true
        }
    }

    return false
}
