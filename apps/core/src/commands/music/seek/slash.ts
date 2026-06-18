import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { hmsToMS } from '@/internals/utility/Utils.js'
import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js'
import numbro from 'numbro'

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

    if (player.voiceChannelId !== interaction.member.voice.channelId) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.YouAreNotConnectedToVoiceChannel', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const currentTrack = player.queue.current!

    if (!currentTrack.info.isSeekable || typeof currentTrack.info.length !== 'number') {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.SeekCommand.Texts.TrackIsNotSeekable', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    let seekPosition: number = 0

    if (interaction.isChatInputCommand()) {
        const timeOption =
            // @ts-expect-error
            interaction.options?.getString('time') ?? numbro((player.position + 5000) / 1000).format({ output: 'time' })
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
        content: `${self.staticEmojis.Check} | ${t('Commands.SeekCommand.Texts.TrackRewoundToPosition', {
            username: `**${interaction.member.displayName}**`,
            // @ts-expect-error
            time: numbro(seekPosition / 1000).format({ output: 'time' })
        })}`
    })

    return true
}
