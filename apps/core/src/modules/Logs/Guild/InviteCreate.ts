import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { BaseGuildTextChannel, EmbedBuilder, Guild, Invite } from 'discord.js'
import { isRateLimited, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, invite: Invite): Promise<boolean> {
    if (server.moderation.logs.types.invite_create.active) {
        if (isRateLimited(server._id)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = (invite.guild as Guild).channels.cache.get(
            server.moderation.logs.types.invite_create.channel_id!
        ) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(self.user!.id)?.has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.InviteCreated'))
                .addFields([
                    { name: t('Logs.InviteCode'), value: `[${invite.code}](${invite.url})`, inline: true },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${invite.channel!.id}>`, inline: true },
                    { name: t('Logs.InviteInviter'), value: `<@${invite.inviter?.id ?? '0'}>`, inline: true }
                ])
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({
                    module: 'LogsInviteCreate',
                    action: 'SendMessageViaWebhook',
                    err,
                    guildId: invite.guild!.id
                })

                return false
            }

            self.emit('moduleExecution', {
                guildId: invite.guild!.id,
                targetId: invite.channelId,
                module: 'Logs',
                category: 'InviteCreate'
            })

            return true
        }
    }

    return false
}
