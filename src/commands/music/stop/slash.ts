import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChatInputCommandInteraction } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const player = self.lava.nodes.getPlayer(interaction.guild.id)

    if (!player) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.PlayCommand.Texts.PlaybackIsNotStarted', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (player.voiceChannelId !== interaction.member.voice.channelId) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.PlayCommand.Texts.YouAreNotConnectedToVoiceChannel', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await player.destroy()
    await interaction.reply({
        content: `${self.staticEmojis.OK} | ${t('Commands.StopCommand.Texts.PlaybackHasBeenStopped', {
            username: `**${interaction.member.displayName}**`
        })}`
    })

    return true
}
