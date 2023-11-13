import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js'
import numbro from 'numbro'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { hmsToMS } from '../../../internals/utility/Utils'

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

    if (player.voiceChannelId !== (interaction.member as any).voice.channelId) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_different_voice', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const currentTrack = player.queue.current

    if (!currentTrack.isSeekable || typeof currentTrack.duration !== 'number') {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.seek.text_track_is_not_seekable', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    let seekPosition: number = 0

    if (interaction.isChatInputCommand()) {
        const timeOption = interaction.options?.getString('время') ?? numbro((player.position + 5000) / 1000).format({ output: 'time' })
        seekPosition = hmsToMS(timeOption)

        if (!seekPosition || isNaN(seekPosition)) seekPosition = player.position + 5000
    } else if (interaction.isButton()) {
        const isForward = interaction.customId === 'PLAYER-SEEK-FAST-FORWARD'
        seekPosition = isForward ? player.position + 5000 : player.position - 5000
    }

    if (seekPosition < 0) seekPosition = 0
    if (seekPosition > currentTrack.duration) seekPosition = currentTrack.duration

    await interaction.deferReply({ ephemeral: interaction.isButton() })
    await player.seek(seekPosition)
    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.seek.text_track_rewound_to_position', {
            user: `**${(interaction.member as any).displayName}**`,
            time: numbro(seekPosition / 1000).format({ output: 'time' })
        })}`
    })

    return true
}
