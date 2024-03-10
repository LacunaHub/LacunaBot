import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js'
import numbro from 'numbro'
import Lacuna from '../../../internals/Lacuna'
import { hmsToMS } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)
    const player = self.lava.nodes.getPlayer(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.PlayCommand.Texts.PlaybackIsNotStarted', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (player.voiceChannelId !== interaction.member.voice.channelId) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.PlayCommand.Texts.YouAreNotConnectedToVoiceChannel', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const currentTrack = player.queue.current

    if (!currentTrack.info.isSeekable || typeof currentTrack.info.length !== 'number') {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.SeekCommand.Texts.TrackIsNotSeekable', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    let seekPosition: number = 0

    if (interaction.isChatInputCommand()) {
        const timeOption = interaction.options?.getString('time') ?? numbro((player.position + 5000) / 1000).format({ output: 'time' })
        seekPosition = hmsToMS(timeOption)

        if (!seekPosition || isNaN(seekPosition)) seekPosition = player.position + 5000
    } else if (interaction.isButton()) {
        const isForward = interaction.customId === 'PLAYER-SEEK-FAST-FORWARD'
        seekPosition = isForward ? player.position + 5000 : player.position - 5000
    }

    if (seekPosition < 0) seekPosition = 0
    if (seekPosition > currentTrack.info.length) seekPosition = currentTrack.info.length

    await interaction.deferReply({ ephemeral: interaction.isButton() })
    await player.seek(seekPosition)
    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('Commands.SeekCommand.Texts.TrackRewoundToPosition', {
            username: `**${interaction.member.displayName}**`,
            time: numbro(seekPosition / 1000).format({ output: 'time' })
        })}`
    })

    return true
}
