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

    player.destroy()
    await interaction.reply({ content: `${self._emojis.OK} | ${t('commands.stop.text_playback_stop', { user: `**${(interaction.member as any).displayName}**` })}` })

    return true
}
