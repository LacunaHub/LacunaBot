import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { BaseGuildTextChannel, EmbedBuilder, VoiceState } from 'discord.js'
import { isRateLimited, sendLog } from '../index.js'

export default async function (self: Lacuna, server: ServerDocument, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_server_deaf.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(
            server.moderation.logs.types.voice_server_deaf.channel_id!
        ) as BaseGuildTextChannel
        const isOk =
            logChannel && logChannel.permissionsFor(state.guild.members.me!).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const embed = new EmbedBuilder()
                .setTitle(t('Logs.VoiceServerDeaf'))
                .addFields([
                    {
                        name: t('Commands.OptionTypes.User'),
                        value: `<@${state.id}> (${state.member?.user?.tag})`,
                        inline: true
                    },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${state.channelId}>`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                ])
                .setFooter({ text: `UID: ${state.id}` })
                .setTimestamp()
                .setColor('#FFA726')

            try {
                await sendLog(self, server, logChannel.id, { embeds: [embed] })
            } catch (err) {
                self.logger.error({
                    module: 'LogsVoiceServerDeaf',
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
                category: 'VoiceServerDeaf'
            })

            return true
        }
    }

    return false
}
