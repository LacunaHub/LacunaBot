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

    if (player.trackRepeat) {
        player.setTrackRepeat(false)
        player.setQueueRepeat(true)
    } else {
        player.setTrackRepeat(true)
    }

    await interaction.reply({
        content: `${self._emojis.OK} | ${t(
            !player.trackRepeat && !player.queueRepeat
                ? 'commands.repeat.text_no_repeat'
                : player.trackRepeat
                ? 'commands.repeat.text_track_repeat'
                : 'commands.repeat.text_queue_repeat',
            { user: `**${(interaction.member as any).displayName}**` }
        )}`
    })

    return true
}
