import { ServerDocument } from '@/database/schemas/Servers'
import { BaseGuildTextChannel, EmbedBuilder, GuildMember } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember): Promise<boolean> {
    if (server.moderation.logs.types.guild_member_add.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_add.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(member.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.GuildMemberAdded'))
                .setDescription(`<@${member.id}> (${member.user.tag})`)
                .addFields([
                    {
                        name: t('Commands.UserCommand.Texts.AccountRegistrationDate'),
                        value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>`,
                        inline: true
                    },
                    { name: t('Commands.ServerCommand.Texts.MemberCount'), value: member.guild.memberCount.toString(), inline: true }
                ])
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({
                    module: 'LogsGuildMemberAdd',
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
                category: 'GuildMemberAdd'
            })

            return true
        }
    }

    return false
}
