import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js'

export default async (
    self: Lacuna,
    server: ServerDocument,
    interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>
) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.lava!.nodes.getPlayer(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.PlaybackIsNotStarted', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    let volume!: number

    if (interaction.isChatInputCommand()) {
        volume = interaction.options?.getInteger('volume')!
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
            content: `${self.staticEmojis.Cross} | ${t('Commands.VolumeCommand.Texts.InvalidVolume', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (volume < 1 || volume > 100) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.VolumeCommand.Texts.InvalidVolumeDiapason', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const volume_before = player.volume

    await interaction.deferReply({ ephemeral: interaction.isButton() })
    await player.setVolume(volume)

    await interaction.editReply({
        content: `${self.staticEmojis.Check} | ${t('Commands.VolumeCommand.Texts.VolumeHasBeenChanged', {
            username: `**${interaction.member.displayName}**`,
            from: volume_before,
            to: volume
        })}`
    })

    return true
}
