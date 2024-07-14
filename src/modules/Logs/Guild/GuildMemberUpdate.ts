import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildMember } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildMember, member: GuildMember): Promise<boolean> {
    if (server.moderation.logs.types.guild_member_update.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_update.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(member.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const audit = member.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberUpdate })
                : null
            const entry = audit?.entries?.find(v => v.targetId === member.id)
            const executor = entry?.executor

            if (before.displayName !== member.displayName) {
                const embed = new EmbedBuilder()
                    .setTitle(t('Logs.GuildMemberUpdated'))
                    .setDescription(
                        t('Logs.UserChangesSomething', {
                            username: `<@${executor?.id ?? member.id}>`,
                            change: t('Logs.GuildMemberUpdatedNickname', { username: `<@${member.id}> (${member.user.tag})` })
                        })
                    )
                    .setFields([
                        { name: t('Logs.BeforeChange'), value: before.displayName, inline: true },
                        { name: t('Logs.AfterChange'), value: member.displayName, inline: true }
                    ])
                    .setTimestamp()
                    .setColor('#FFA726')

                try {
                    await sendLog(self, server, logChannel.id, { embeds: [embed] })
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
