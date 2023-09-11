import { BaseGuildTextChannel, EmbedBuilder, VoiceState } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_server_unmute.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_unmute.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(state.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const embed = new EmbedBuilder()
                .setTitle(t('logs.voice_server_unmute'))
                .addFields([
                    { name: t('common.command_option_types.USER'), value: `${state.member.user.tag}`, inline: true },
                    { name: t('common.channel'), value: `<#${state.channelId}>`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                ])
                .setFooter({ text: state.member.id })
                .setTimestamp()
                .setColor('#FFA726')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({
                    module: 'LogsVoiceServerUnmute',
                    action: 'SendMessageViaWebhook',
                    error: err,
                    guild_id: state.guild.id
                })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'VoiceServerUnmute',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }
    }

    return false
}
