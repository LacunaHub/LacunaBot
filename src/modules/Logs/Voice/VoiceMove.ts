import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, EmbedBuilder, VoiceState } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: VoiceState, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_disconnect.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(server.moderation.logs.types.voice_move.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(state.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.VoiceMove'))
                .setDescription(
                    t('Logs.VoiceMoveTemplate', {
                        username: `**${state.member.user.tag}**`,
                        from: `<#${before.channelId}>`,
                        to: `<#${state.channelId}>`
                    })
                )
                .setFooter({ text: state.member.id })
                .setTimestamp()
                .setColor('#FFA726')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsVoiceMove', action: 'SendMessageViaWebhook', error: err, guild_id: state.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'VoiceMove',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }
    }

    return false
}
