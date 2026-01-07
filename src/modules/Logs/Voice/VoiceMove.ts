import { ServerDocument } from '@/database/schemas/Servers'
import { BaseGuildTextChannel, EmbedBuilder, VoiceState } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: VoiceState, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_disconnect.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(server.moderation.logs.types.voice_move.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(state.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.VoiceMove'))
                .setDescription(
                    t('Logs.VoiceMoveTemplate', {
                        username: `<@${state.id}> (${state.member.user.tag})`,
                        from: `<#${before.channelId}>`,
                        to: `<#${state.channelId}>`
                    })
                )
                .setFooter({ text: `UID: ${state.id}` })
                .setTimestamp()
                .setColor('#FFA726')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({ module: 'LogsVoiceMove', action: 'SendMessageViaWebhook', err, guildId: state.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                guildId: state.guild.id,
                targetId: state.id,
                module: 'Logs',
                category: 'VoiceMove'
            })

            return true
        }
    }

    return false
}
