import { BaseGuildTextChannel, EmbedBuilder, GuildMember } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember): Promise<boolean> {
    if (server.moderation.logs.types.guild_member_add.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_add.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(member.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const embed = new EmbedBuilder()
                .setTitle(t('logs.guild_member_add_title'))
                .setDescription(`${member.user.tag} (${member.id})`)
                .addFields([
                    {
                        name: t('commands.user.text_registration_date'),
                        value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>`,
                        inline: true
                    },
                    { name: t('logs.guild_member_count'), value: member.guild.memberCount.toString(), inline: true }
                ])
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                self.logger.handleError({ module: 'LogsGuildMemberAdd', action: 'SendMessageViaWebhook', error: err, guild_id: member.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'GuildMemberAdd',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })

            return true
        }
    }

    return false
}
