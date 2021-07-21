const { Util } = require('discord.js')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const playback = self.player.get(message.guild.id)
    const voice = message.guild.me.voice

    if (!playback) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!voice.channel.members.has(message.author.id)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.skip.texts.no_on_voice_channel, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (playback.queue.tracks.length < 2) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.skip.texts.few_queue_tracks, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (!message.member.hasPermission('MANAGE_CHANNELS')) {
        await self.player.queues.voteForSkip(message.guild.id)
        const members = voice.channel.members.filter(m => !m.user.bot)

        if (playback.queue.skip_votes >= (members.size - playback.queue.skip_votes)) {
            await self.player.queues.resetSkipVotes(message.guild.id)
            
            await message.reply(Util.removeMentions(`${self._emojis.OK} | ${self.translator.format(locale.skip.texts.skipped, `**${message.author.username}**`, `**${playback.queue.tracks[0].info.title}**`)}`), { allowedMentions: { repliedUser: false } })
            await playback.player.emit('end', { reason: 'FINISHED' })
        }

        else {
            await message.reply(Util.removeMentions(`${self._emojis.OK} | ${self.translator.format(locale.skip.texts.vote_for_skip, `**${message.author.username}**`, `**${playback.queue.tracks[0].info.title}**`, `\`${playback.queue.skip_votes}/${members.size - playback.queue.skip_votes}\``)}`), { allowedMentions: { repliedUser: false } })
        }
    }

    else {
        await self.player.queues.resetSkipVotes(message.guild.id)

        await message.reply(Util.removeMentions(`${self._emojis.OK} | ${self.translator.format(locale.skip.texts.skipped, `**${message.author.username}**`, `**${playback.queue.tracks[0].info.title}**`)}`), { allowedMentions: { repliedUser: false } })
        await playback.player.emit('end', { reason: 'FINISHED' })
    }

    return true
}

module.exports = {
    fn: execute,
    name: 'skip',
    description: 'commands.skip.description',
    group: 'music',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES']
}