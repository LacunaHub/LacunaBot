import { ChatInputCommandInteraction } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_no_track_playback', {
                user: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (player.voiceChannelId !== interaction.member.voice.channelId) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_different_voice', { user: `**${interaction.member.displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await player.destroy()
    await interaction.reply({
        content: `${self._emojis.OK} | ${t('commands.stop.text_playback_stop', { user: `**${interaction.member.displayName}**` })}`
    })

    return true
}
