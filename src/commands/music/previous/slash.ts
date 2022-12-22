import { ChatInputCommandInteraction } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_no_track_playback', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (player.voiceChannel != (interaction.member as any).voice.channelId) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_different_voice', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!player.queue.previous) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.previous.text_no_previous_track', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await player.play(player.queue.previous)
    player.queue.add(player.queue.previous, 0)
    await interaction.reply({ content: `${self._emojis.OK} | ${t('commands.previous.text_track_previous', { user: `**${(interaction.member as any).displayName}**` })}` })

    return true
}
