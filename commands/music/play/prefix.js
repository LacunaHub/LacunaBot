const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const numbro = require('numbro')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const query = message.args.join(' ')
    const voice = message.member.voice?.channel

    if (!voice) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_voice_channel, `**${message.member.displayName}**`)}` })

        return false
    }

    if ((server.modules.music.allowed.channels.length && !server.modules.music.allowed.channels.includes(voice.id)) || server.modules.music.blocked.channels.includes(voice.id)) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.not_allowed_in_current_channel, `**${message.member.displayName}**`)}` })

        return false
    }

    const has_permissions = voice.permissionsFor(message.guild.me).has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'USE_VAD'])

    if (!has_permissions) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_required_permissions_in_voice, `**${message.member.displayName}**`)}` })

        return false
    }

    if (voice.full && !voice.permissionsFor(message.guild.me).has('MOVE_MEMBERS') && !voice.members.has(self.user.id)) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.voice_is_full, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!query) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_search_track, `**${message.member.displayName}**`)}` })

        return false
    }

    const is_url = new RegExp(`^https?:\/\/`).test(query)
    delete require.cache[require.resolve('../../../database/playable-music-hosts.json')]
    const allowed_hosts = require('../../../database/playable-music-hosts.json')

    if (is_url && !allowed_hosts.some(h => query.startsWith(h))) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.not_allowed_host, `**${message.member.displayName}**`)}` })

        return false
    }

    const search = await self.player.search(query, message.author.tag)

    if (search.loadType === 'LOAD_FAILED') {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.load_failed, `**${message.member.displayName}**`)}` })

        return false
    }

    if (search.loadType === 'NO_MATCHES') {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_matches, `**${message.member.displayName}**`)}` })

        return false
    }

    const player = self.player.create({
        guild: message.guild.id,
        voiceChannel: voice.id,
        textChannel: message.channelId,
        selfDeafen: true,
        volume: server.modules.music.default_volume
    })

    /**
     * @type {import('discord.js').Message}
     */
    let _message

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('previous')
                .setStyle('SECONDARY')
                .setEmoji('⏮️'),
            new MessageButton()
                .setCustomId('pause-resume')
                .setStyle('SECONDARY')
                .setEmoji('⏸️'),
            new MessageButton()
                .setCustomId('skip')
                .setStyle('SECONDARY')
                .setEmoji('⏭️'),
            new MessageButton()
                .setCustomId('repeat-one')
                .setStyle('SECONDARY')
                .setEmoji('🔂')
        )

    if (search.loadType === 'PLAYLIST_LOADED') {
        if (!server.server.premium.available) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.playlist_loaded_no_premium, `**${message.member.displayName}**`)}` })

            return false
        }

        for (const track of search.tracks.slice(0, 99)) await player.queue.add(track)

        const track = search.tracks[0]

        const embed = new MessageEmbed()
            .setTitle(locale.play.texts.player)
            .setDescription(`${track.title} \`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``)
            .setFooter(self.translator.format(locale.play.texts.added_by, track.requester))

            _message = await message.reply({ embeds: [embed], components: [row] })
    }

    if (search.loadType === 'TRACK_LOADED' || search.loadType === 'SEARCH_RESULT') {
        const track = search.tracks[0]

        if (player.queue.length >= server.modules.music.queue_max_length && server.modules.music.queue_max_length) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.queue_limit_reached_no_premium, `**${message.member.displayName}**`)}` })

            return false
        }

        if (track.isStream && !server.server.premium.available) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.track_stream_only_for_premium, `**${message.member.displayName}**`)}` })

            return false
        }

        if (track.isStream && !server.modules.music.allow_radio_playback) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.track_stream_disabled, `**${message.member.displayName}**`)}` })

            return false
        }

        await player.queue.add(track)

        const embed = new MessageEmbed()
            .setTitle(locale.play.texts.player)
            .setDescription(`${track.title} \`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``)
            .setFooter(self.translator.format(locale.play.texts.added_by, track.requester))

        if (player.playing) await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.play.texts.added_to_queue, `**${message.member.displayName}**`, `**${track.title}**`)}`, allowedMentions: { roles: [], users: [] } })

        else {
            _message = await message.reply({ embeds: [embed], components: [row] })
        }
    }

    if (player.state != 'CONNECTED') await player.connect()

    if (!player.playing && !player.paused) {
        if (!player.get('message')) player.set('message', _message)

        await player.play()
        player.setQueueRepeat(true)

        const collector = _message.createMessageComponentCollector({
            filter: i => row.components.some(c => c.customId == i.customId) && voice.members.has(i.user.id),
            time: 900000
        })

        if (!player.get('collector')) player.set('collector', collector)

        collector.on('collect', async i => {
            if (i.customId == row.components[0].customId) {
                if (player.queue.previous && player.position < 5000) {
                    await player.play(player.queue.previous)
                    await player.queue.add(player.queue.previous, 0)
                }

                else if (player.queue.current.isSeekable) await player.seek(0)
            }

            if (i.customId == row.components[1].customId) {
                await player.pause(!player.paused)
            
                row.components[1].setEmoji(player.paused ? '▶️' : '⏸️')
            }

            if (i.customId == row.components[2].customId) {
                if (player.playing && player.queue.current) await player.stop()
            }

            if (i.customId == row.components[3].customId) {
                if (player.trackRepeat) {
                    row.components[3].setEmoji('🔂')
                    player.setTrackRepeat(false)
                    player.setQueueRepeat(true)
                }

                else {
                    row.components[3].setEmoji('🔁')
                    player.setTrackRepeat(true)
                }
            }

            await _message.edit({ components: [row] }).catch(() => {})
            await i.deferUpdate()

            collector.resetTimer()
        })

        collector.on('end', async () => await _message.edit({ components: [] }).catch(() => {}))
    }

    return true
}
