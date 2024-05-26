import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, EmbedBuilder, Guild, Invite } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, invite: Invite): Promise<boolean> {
    if (server.moderation.logs.types.invite_delete.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = (invite.guild as Guild).channels.cache.get(server.moderation.logs.types.invite_delete.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor((invite.guild as Guild).members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.InviteDeleted'))
                .addFields([
                    { name: t('Logs.InviteCode'), value: invite.code, inline: true },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${invite.channel.id}>`, inline: true },
                    { name: t('Logs.InviteInviter'), value: `<@${invite.inviter?.id ?? '0'}>`, inline: true }
                ])
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await webhook.send({ embeds: [embed] })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsInviteDelete', action: 'SendMessageViaWebhook', error: err, guild_id: invite.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'InviteDelete',
                guild: { id: invite.guild.id, name: invite.guild.name },
                target: { id: invite.channel.name, name: invite.code }
            })

            return true
        }
    }

    return false
}
