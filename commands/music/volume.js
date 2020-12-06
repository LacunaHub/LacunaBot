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
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    const volume = args[0] ? Number(args[0]) : null

    if (!volume || isNaN(volume)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.volume.texts.invalid_volume, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (volume < 1 || volume > 100) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.volume.texts.volume_diapason, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    await playback.player.volume(volume)
    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.volume.texts.volume_changed, `**${message.author.username}**`, self.player.queues.currentVolume(message.guild.id), volume)}`, { allowedMentions: { repliedUser: false } })
    await self.player.queues.volume(message.guild.id, volume)

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'modules.music.default_volume': volume
        }
    })

    return true
}

module.exports = {
    fn: execute,
    name: 'volume',
    description: 'commands.volume.description',
    aliases: ['vol'],
    group: 'music',
    guild_only: true,
    premium_only: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['MANAGE_CHANNELS']
}