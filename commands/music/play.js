/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const search_track = args.join(' ')
    const voice = message.member.voice.channel

    if (!voice) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_voice_channel, `**${message.author.username}**`)}`)

        return false
    }

    const has_permissions = voice.permissionsFor(message.guild.me).has(['CONNECT', 'SPEAK', 'USE_VAD'])

    if (!has_permissions) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_required_permissions_in_voice, `**${message.author.username}**`)}`)

        return false
    }

    if (!search_track) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_search_track, `**${message.author.username}**`)}`)

        return false
    }

    const queue = self.player.queues.fetch(message.guild.id, { tracks: [], volume: server.modules.music.default_volume, repeat: false, skip_votes: 0, executor: message.author.id })

    const _message = await message.channel.send(`:mag: | ${self.translator.format(locale.play.texts.search_in_progress, `**${message.author.username}**`, `\`${search_track}\``)}`)
    const search = await self.player.search(search_track)

    if (search.loadType === 'LOAD_FAILED') {
        await _message.edit(`${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.load_failed, `**${message.author.username}**`)}`)

        return false
    }

    if (search.loadType === 'NO_MATCHES') {
        await _message.edit(`${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_matches, `**${message.author.username}**`)}`)

        return false
    }

    const player = await self.player.manager.join({ guild: message.guild.id, channel: voice.id, node: self.player.optimalNode.id }, { selfdeaf: true })

    let reply = ''

    if (search.loadType === 'PLAYLIST_LOADED') {
        if (!server.server.premium.available) {
            await _message.edit(`${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.playlist_loaded_no_premium, `**${message.author.username}**`)}`)

            return false
        }

        for (const track of search.tracks) {
            await queue.tracks.push(track)
        }

        reply = `:musical_note: | ${self.translator.format(locale.play.texts.playlist_loaded, `**${message.author.username}**`)}`
    }

    if (search.loadType === 'TRACK_LOADED' || search.loadType === 'SEARCH_RESULT') {
        const track = search.tracks[0]

        await queue.tracks.push(track)

        if (player.playing) reply = `:musical_note: | ${self.translator.format(locale.play.texts.added_to_queue, `**${message.author.username}**`, `**${track.info.title}**`, queue.tracks.length)}`
        else reply = `:musical_note: | ${self.translator.format(locale.play.texts.now_playing, `**${message.author.username}**`, `**${track.info.title}**`)}`
    }

    await _message.edit(reply)

    if (!player.playing) {
        await player.play(queue.tracks[0].track, { volume: queue.volume })

        player.once('error', async err => {
            await _message.edit(`${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.unknown_error, `**${message.author.username}**`)}`)
            
            if (err.type == 'TrackExceptionEvent') {
                await player.emit('end', { reason: 'FINISHED' })
            } else {
                await self.player.destroy(message.guild.id)
            }

            await self.emit('playerNodeError', err, player.node)
        })
    
        player.on('end', async data => {
            if (data.reason === 'FINISHED') {
                const listeners = voice ? voice.members.filter(m => !m.user.bot).size : 0

                if (!listeners) {
                    await self.player.wait(data.guildId, true)

                    return null
                }

                if (!queue.repeat) await queue.tracks.shift()
    
                if (queue.tracks.length) {
                    await player.play(queue.tracks[0].track, { volume: queue.volume })
                }
    
                else {
                    await self.player.wait(data.guildId, true)
                }
            }
    
            if (data.reason === 'STOPPED') {
                await self.player.destroy(data.guildId)
            }

            if (data.reason === 'LOAD_FAILED') {
                await player.emit('end', { reason: 'FINISHED' })
            }
        })
    }

    return true
}

module.exports = {
    fn: execute,
    name: 'play',
    description: 'commands.play.description',
    group: 'music',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES']
}