import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { AuditLogEvent, EmbedBuilder, GuildAuditLogsEntry } from 'discord.js'
import { isRateLimited, type LogEventData, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    data: GuildMemberUpdateLogEventData
): Promise<boolean> {
    if (!server.moderation.logs.types.guild_member_update.active) return false
    if (isRateLimited(server._id, server.premium.available)) return false

    const t = self.i18n.t.bind(null, server.locale)
    const { guild, auditLogEntry } = data
    const { target, executor } = auditLogEntry

    const logChannel = guild.channels.cache.get(server.moderation.logs.types.guild_member_update.channel_id!)
    if (!logChannel || !logChannel.permissionsFor(guild.members.me!).has(self.PermissionFlags.ManageWebhooks))
        return false

    const nickChange = auditLogEntry.changes.find(v => v.key === 'nick')

    if (nickChange) {
        const embed = new EmbedBuilder()
            .setTitle(t('Logs.GuildMemberUpdated'))
            .setDescription(
                t('Logs.UserChangesSomething', {
                    username: `<@${executor?.id ?? '0'}>`,
                    change: t('Logs.GuildMemberUpdatedNickname', { username: `<@${target!.id}> (${target!.tag})` })
                })
            )
            .setFields([
                { name: t('Logs.BeforeChange'), value: nickChange.old ?? '-', inline: true },
                { name: t('Logs.AfterChange'), value: nickChange.new ?? '-', inline: true }
            ])
            .setTimestamp()
            .setColor('#FFA726')

        try {
            await sendLog(self, server, logChannel.id, { embeds: [embed] })
        } catch (err) {
            self.logger.error({
                module: 'LogsGuildMemberUpdateName',
                action: 'SendMessageViaWebhook',
                err,
                guildId: guild.id
            })

            return false
        }
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: target!.id,
        module: 'Logs',
        category: 'GuildMemberUpdate'
    })

    return true
}

export interface GuildMemberUpdateLogEventData extends LogEventData {
    auditLogEntry: GuildAuditLogsEntry<AuditLogEvent.MemberUpdate>
}
