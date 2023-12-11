import { BaseGuildTextChannel, EmbedBuilder, Guild, Invite } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, invite: Invite): Promise<boolean> {
    if (server.moderation.logs.types.invite_create.active) {
        if (isRateLimited(server._id) && !server.server.premium.available) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = (invite.guild as Guild).channels.cache.get(server.moderation.logs.types.invite_create.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor((invite.guild as Guild).members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.InviteCreated'))
                .addFields([
                    { name: t('Logs.InviteCode'), value: `[${invite.code}](${invite.url})`, inline: true },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${invite.channel.id}>`, inline: true },
                    { name: t('Logs.InviteInviter'), value: invite.inviter?.tag ?? '-', inline: true }
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
                await self.logger.handleError({ module: 'LogsInviteCreate', action: 'SendMessageViaWebhook', error: err, guild_id: invite.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'InviteCreate',
                guild: { id: invite.guild.id, name: invite.guild.name },
                target: { id: invite.channel.name, name: invite.code }
            })

            return true
        }
    }

    return false
}
