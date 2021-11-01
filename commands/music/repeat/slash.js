/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const player = self.player.get(interaction.guild.id)

    if (!player) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (player.voiceChannel != interaction.member.voice.channelId) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.repeat.texts.different_voice, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (player.trackRepeat) {
        player.setTrackRepeat(false)
        player.setQueueRepeat(true)
    }

    else {
        player.setTrackRepeat(true)
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(player.trackRepeat ? locale.repeat.texts.track_repeat : locale.repeat.texts.queue_repeat, `**${interaction.member.displayName}**`)}` })

    return true
}