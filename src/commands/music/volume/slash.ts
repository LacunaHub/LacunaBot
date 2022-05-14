import { CommandInteraction } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    const volume = interaction.options?.getInteger('громкость')

    if (!volume || isNaN(volume)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.volume.texts.invalid_volume, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (volume < 1 || volume > 100) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.volume.texts.volume_diapason, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    const volume_before = player.volume

    player.setVolume(volume)
    await interaction.reply({
        content: `${self._emojis.OK} | ${self.translator.format(locale.volume.texts.volume_changed, `**${(interaction.member as any).displayName}**`, volume_before, volume)}`
    })

    await self.db.servers.updateOne(
        { _id: interaction.guild.id },
        {
            $set: {
                'modules.music.default_volume': volume
            }
        }
    )

    return true
}
