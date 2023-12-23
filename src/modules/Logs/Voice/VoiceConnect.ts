import { BaseGuildTextChannel, EmbedBuilder, VoiceState } from 'discord.js'
import { fetchLogWebhook, isRateLimited } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_connect.active) {
        const rateLimited = isRateLimited(server._id, server.server.premium.available)

        console.log(rateLimited)

        if (rateLimited) return false

        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = state.guild.channels.cache.get(server.moderation.logs.types.voice_connect.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(state.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const embed = new EmbedBuilder()
                .setTitle(t('Logs.VoiceConnection'))
                .setDescription(
                    t('Logs.VoiceConnectionTemplate', { username: `**${state.member.user.tag}**`, channel: `<#${state?.channelId ?? '1'}>` })
                )
                .setFooter({ text: state.member.id })
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsVoiceConnect', action: 'SendMessageViaWebhook', error: err, guild_id: state.guild.id })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'VoiceConnect',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }
    }

    return false
}
