const { MessageEmbed } = require('discord.js')
const numbro = require('numbro')

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

    const embed = new MessageEmbed()
        .setFooter(self.translator.format(locale.queue.texts.footer, playback.queue.tracks.length))

    for (const track of playback.queue.tracks.filter(t => playback.queue.tracks.indexOf(t) < 15)) {
        embed.addField(track.info.author, `[${track.info.title}](${track.info.uri}) \`[${numbro(track.info.length / 1000).format({ output: 'time' })}]\``)
    }

    await message.channel.send(embed)

    return true
}

module.exports = {
    fn: execute,
    name: 'queue',
    aliases: ['q'],
    description: 'commands.queue.description',
    group: 'music',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES']
}