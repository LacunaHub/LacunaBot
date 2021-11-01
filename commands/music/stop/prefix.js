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

    await player.destroy()
    await message.reply({ content: `${self._emojis.OK}` })

    return true
}