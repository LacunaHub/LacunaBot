import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { BaseGuildTextChannel, EmbedBuilder, VoiceState } from 'discord.js'
import { isRateLimited, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_connect.active) {
        const rateLimited = isRateLimited(server._id, server.premium.available)

        if (rateLimited) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(
            server.moderation.logs.types.voice_connect.channel_id!
        ) as BaseGuildTextChannel
        const isOk =
            logChannel && logChannel.permissionsFor(state.guild.members.me!).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.VoiceConnection'))
                .setDescription(
                    t('Logs.VoiceConnectionTemplate', {
                        username: `<@${state.id}> (${state.member?.user?.tag})`,
                        channel: `<#${state?.channelId ?? '0'}>`
                    })
                )
                .setFooter({ text: `UID: ${state.id}` })
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({
                    module: 'LogsVoiceConnect',
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
                category: 'VoiceConnect'
            })

            return true
        }
    }

    return false
}
