/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const player = self.player.get(message.guild.id)

    if (!player) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${message.member.displayName}**`)}` })

        return false
    }

    if (player.voiceChannel != message.member.voice.channelId) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.repeat.texts.different_voice, `**${message.member.displayName}**`)}` })

        return false
    }

    if (player.trackRepeat) {
        player.setTrackRepeat(false)
        player.setQueueRepeat(true)
    }

    else {
        player.setTrackRepeat(true)
    }

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(player.trackRepeat ? locale.repeat.texts.track_repeat : locale.repeat.texts.queue_repeat, `**${message.member.displayName}**`)}` })

    return true
}