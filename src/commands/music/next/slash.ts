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

    if (player.voiceChannel != (interaction.member as any).voice.channelId) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_different_voice', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!player.queue.current) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.next.text_no_playback', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    player.stop()
    await interaction.reply({ content: `${self._emojis.OK} | ${t('commands.next.text_track_skip', { user: `**${(interaction.member as any).displayName}**` })}` })

    return true
}
