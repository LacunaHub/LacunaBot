import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { BaseGuildTextChannel, EmbedBuilder, GuildMember } from 'discord.js'
import { isRateLimited, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember): Promise<boolean> {
    if (server.moderation.logs.types.guild_member_remove.active) {
        if (isRateLimited(server._id)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = member.guild.channels.cache.get(
            server.moderation.logs.types.guild_member_remove.channel_id!
        ) as BaseGuildTextChannel
        const isOk =
            logChannel && logChannel.permissionsFor(member.guild.members.me!).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.GuildMemberRemoved'))
                .setDescription(`<@${member.id}> (${member.user.tag})`)
                .addFields([
                    { name: t('Commands.ServerCommand.Texts.MemberCount'), value: member.guild.memberCount.toString() }
                ])
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({
                    module: 'LogsGuildMemberRemove',
                    action: 'SendMessageViaWebhook',
                    err,
                    guildId: member.guild.id
                })

                return false
            }

            self.emit('moduleExecution', {
                guildId: member.guild.id,
                targetId: member.id,
                module: 'Logs',
                category: 'GuildMemberRemove'
            })

            return true
        }
    }

    return false
}
