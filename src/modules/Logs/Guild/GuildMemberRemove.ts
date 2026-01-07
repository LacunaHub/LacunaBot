import { ServerDocument } from '@/database/schemas/Servers'
import { BaseGuildTextChannel, EmbedBuilder, GuildMember } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember): Promise<boolean> {
    if (server.moderation.logs.types.guild_member_remove.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_remove.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(member.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.GuildMemberRemoved'))
                .setDescription(`<@${member.id}> (${member.user.tag})`)
                .addFields([{ name: t('Commands.ServerCommand.Texts.MemberCount'), value: member.guild.memberCount.toString() }])
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                await self.logger.handleError({
                    module: 'LogsGuildMemberRemove',
                    action: 'SendMessageViaWebhook',
                    error: err,
                    guild_id: member.guild.id
                })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'GuildMemberRemove',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })

            return true
        }
    }

    return false
}
