import { Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import numbro from 'numbro'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const query = message['args'].join(' ')
    const voice = message.member.voice?.channel

    if (!voice) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_voice_channel, `**${message.member.displayName}**`)}` })

        return false
    }

    if (
        (server.modules.music.allowed.channels.length && !server.modules.music.allowed.channels.includes(voice.id)) ||
        server.modules.music.blocked.channels.includes(voice.id)
    ) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.not_allowed_in_current_channel, `**${message.member.displayName}**`)}`
        })

        return false
    }

    const has_permissions = voice.permissionsFor(message.guild.me).has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'USE_VAD'])

    if (!has_permissions) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_required_permissions_in_voice, `**${message.member.displayName}**`)}`
        })

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
    const { playableMusicHosts: allowed_hosts } = await self.db.json.get()

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

    let _message: Message

    const rows = [
        new MessageActionRow().addComponents(
            new MessageButton().setCustomId('PLAYER-STOP').setStyle('SECONDARY').setEmoji('⏹️'),
            new MessageButton().setCustomId('PLAYER-PREVIOUS').setStyle('SECONDARY').setEmoji('⏮️'),
            new MessageButton().setCustomId('PLAYER-PAUSE-RESUME').setStyle('SECONDARY').setEmoji('⏸️'),
            new MessageButton().setCustomId('PLAYER-SKIP').setStyle('SECONDARY').setEmoji('⏭️'),
            new MessageButton().setCustomId('PLAYER-REPEAT').setStyle('SECONDARY').setEmoji('🔁')
        ),
        new MessageActionRow().addComponents(new MessageButton().setCustomId('PLAYER-QUEUE').setStyle('SECONDARY').setEmoji('🎶'))
    ]

    if (search.loadType === 'PLAYLIST_LOADED') {
        if (!server.server.premium.available) {
            await message.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.playlist_loaded_no_premium, `**${message.member.displayName}**`)}`
            })

            return false
        }

        for (const track of search.tracks.slice(0, 99)) await player.queue.add(track)

        const track = search.tracks[0]

        const embed = new MessageEmbed()
            .setTitle(locale.play.texts.player)
            .setDescription(`${track.title} \`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``)
            .setFooter({ text: self.translator.format(locale.play.texts.added_by, track.requester) })

        if (player.playing || player.paused)
            await message.reply({
                content: `${self._emojis.OK} | ${self.translator.format(
                    locale.play.texts.playlist_added_to_queue,
                    `**${message.member.displayName}**`,
                    `**${search.playlist.name}**`
                )}`,
                allowedMentions: { roles: [], users: [] }
            })
        else {
            _message = await message.reply({ embeds: [embed], components: rows })
        }
    }

    if (search.loadType === 'TRACK_LOADED' || search.loadType === 'SEARCH_RESULT') {
        const track = search.tracks[0]

        if (player.queue.length >= server.modules.music.queue_max_length && server.modules.music.queue_max_length) {
            await message.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.queue_limit_reached_no_premium, `**${message.member.displayName}**`)}`
            })

            return false
        }

        if (track.isStream && !server.server.premium.available) {
            await message.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.track_stream_only_for_premium, `**${message.member.displayName}**`)}`
            })

            return false
        }

        if (track.isStream && !server.modules.music.allow_radio_playback) {
            await message.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.track_stream_disabled, `**${message.member.displayName}**`)}`
            })

            return false
        }

        player.queue.add(track)

        const embed = new MessageEmbed()
            .setTitle(locale.play.texts.player)
            .setDescription(`${track.title} \`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``)
            .setFooter({ text: self.translator.format(locale.play.texts.added_by, track.requester) })

        if (player.playing || player.paused)
            await message.reply({
                content: `${self._emojis.OK} | ${self.translator.format(
                    locale.play.texts.track_added_to_queue,
                    `**${message.member.displayName}**`,
                    `**${track.title}**`
                )}`,
                allowedMentions: { roles: [], users: [] }
            })
        else {
            _message = await message.reply({ embeds: [embed], components: rows })
        }
    }

    if (player.state != 'CONNECTED') player.connect()

    if (!player.playing && !player.paused) {
        if (!player.get('message')) player.set('message', _message)

        await player.play()
    }

    return true
}
