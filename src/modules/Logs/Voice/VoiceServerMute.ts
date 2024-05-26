import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, EmbedBuilder, VoiceState } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_server_mute.active) {
        if (isRateLimited(server._id, server.premium.available)) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_mute.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(state.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.VoiceServerMute'))
                .addFields([
                    { name: t('Commands.OptionTypes.User'), value: `<@${state.id}> (${state.member.user.tag})`, inline: true },
                    { name: t('Commands.OptionTypes.Channel'), value: `<#${state.channelId}>`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                ])
                .setFooter({ text: `UID: ${state.id}` })
                .setTimestamp()
                .setColor('#FFA726')

            try {
                await webhook.send({ embeds: [embed] })
            } catch (err) {
                await self.logger.handleError({
                    module: 'LogsVoiceServerMute',
                    action: 'SendMessageViaWebhook',
                    error: err,
                    guild_id: state.guild.id
                })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'VoiceServerMute',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }
    }

    return false
}
