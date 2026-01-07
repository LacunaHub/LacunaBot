import { ServerDocument } from '@/database/schemas/Servers'
import { BaseGuildTextChannel, EmbedBuilder, VoiceChannel, VoiceState } from 'discord.js'
import { isRateLimited, sendLog } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, state: VoiceState, channel: VoiceChannel): Promise<boolean> {
    if (server.moderation.logs.types.voice_disconnect.active) {
        const rateLimited = isRateLimited(server._id, server.premium.available)

        if (rateLimited) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(server.moderation.logs.types.voice_disconnect.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(state.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.VoiceDisconnection'))
                .setDescription(
                    t('Logs.VoiceDisconnectionTemplate', {
                        username: `<@${state.id}> (${state.member.user.tag})`,
                        channel: `<#${channel?.id ?? '0'}>`
                    })
                )
                .setFooter({ text: `UID: ${state.id}` })
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                await self.logger.handleError({
                    module: 'LogsVoiceDisconnect',
                    action: 'SendMessageViaWebhook',
                    error: err,
                    guild_id: state.guild.id
                })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'VoiceDisconnect',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }
    }

    return false
}
