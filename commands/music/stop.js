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

    if (playback.queue.executor != message.author.id && !message.member.hasPermission('MANAGE_CHANNELS')) {
        await message.react(self._emojis.details.ERROR.id)
    }

    await self.player.destroy(message.guild.id)
    await message.react(self._emojis.details.OK.id)

    return true
}

module.exports = {
    fn: execute,
    name: 'stop',
    description: 'commands.stop.description',
    group: 'music',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES']
}