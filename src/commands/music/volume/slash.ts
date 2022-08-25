import { CommandInteraction } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_no_track_playback', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const volume = interaction.options?.getInteger(t('commands.volume.options.volume.name'))

    if (!volume || isNaN(volume)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.volume.text_invalid_volume', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (volume < 1 || volume > 100) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.volume.text_volume_diapason', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const volume_before = player.volume

    await interaction.deferReply()
    player.setVolume(volume)

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.volume.text_volume_changed', {
            user: `**${(interaction.member as any).displayName}**`,
            from: volume_before,
            to: volume
        })}`
    })

    return true
}
