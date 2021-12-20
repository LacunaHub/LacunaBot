import { CommandInteraction } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (player.voiceChannel != (interaction.member as any).voice.channelId) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.repeat.texts.different_voice, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!player.queue.current) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.next.texts.no_playback, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    player.stop()
    await interaction.reply({ content: `${self._emojis.OK}` })

    return true
}