/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const playback = self.player.get(message.guild.id)

    if (!playback) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${message.author.username}**`)}`)

        return false
    }

    await message.channel.send(`:notes: | ${self.translator.format(locale.current.texts.now_playing, `**${message.author.username}**`, `**${playback.queue.tracks[0].info.title}**`)}`)

    return true
}

module.exports = {
    fn: execute,
    name: 'current',
    description: 'commands.current.description',
    group: 'music',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES']
}