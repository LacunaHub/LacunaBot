import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction | ButtonInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_no_track_playback', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    let volume: number

    if (interaction.isChatInputCommand()) {
        volume = interaction.options?.getInteger(self.i18n.t(interaction.locale, 'commands.volume.options.volume.name'))
    } else if (interaction.isButton()) {
        if (interaction.customId === 'PLAYER-VOLUME-DOWN') {
            volume = player.volume - 10
        }

        if (interaction.customId === 'PLAYER-VOLUME-UP') {
            volume = player.volume + 10
        }
    }

    if (!volume || isNaN(volume)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.volume.text_invalid_volume', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (volume < 1 || volume > 100) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.volume.text_volume_diapason', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const volume_before = player.volume

    await interaction.deferReply({ ephemeral: interaction.isButton() })
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
