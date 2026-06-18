import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { BaseGuildTextChannel, EmbedBuilder, VoiceChannel, VoiceState } from 'discord.js'
import { isRateLimited, sendLog } from '../index.js'

export default async function (
    self: Lacuna,
    server: ServerDocument,
    state: VoiceState,
    channel: VoiceChannel
): Promise<boolean> {
    if (server.moderation.logs.types.voice_disconnect.active) {
        const rateLimited = isRateLimited(server._id, server.premium.available)

        if (rateLimited) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(
            server.moderation.logs.types.voice_disconnect.channel_id!
        ) as BaseGuildTextChannel
        const isOk =
            logChannel && logChannel.permissionsFor(state.guild.members.me!).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.VoiceDisconnection'))
                .setDescription(
                    t('Logs.VoiceDisconnectionTemplate', {
                        username: `<@${state.id}> (${state.member?.user?.tag})`,
                        channel: `<#${channel?.id ?? '0'}>`
                    })
                )
                .setFooter({ text: `UID: ${state.id}` })
                .setTimestamp()
                .setColor('#EF5350')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({
                    module: 'LogsVoiceDisconnect',
                    action: 'SendMessageViaWebhook',
                    err,
                    guildId: state.guild.id
                })

                return false
            }

            self.emit('moduleExecution', {
                guildId: state.guild.id,
                targetId: state.id,
                module: 'Logs',
                category: 'VoiceDisconnect'
            })

            return true
        }
    }

    return false
}
