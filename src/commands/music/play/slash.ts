import { CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import numbro from 'numbro'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const query = interaction.options?.getString('запрос')
    const voice = (interaction.member as GuildMember).voice?.channel

    if (!voice) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_voice_channel, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if ((server.modules.music.allowed.channels.length && !server.modules.music.allowed.channels.includes(voice.id)) || server.modules.music.blocked.channels.includes(voice.id)) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.not_allowed_in_current_channel, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const has_permissions = voice.permissionsFor(interaction.guild.me).has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'USE_VAD'])

    if (!has_permissions) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_required_permissions_in_voice, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (voice.full && !voice.permissionsFor(interaction.guild.me).has('MOVE_MEMBERS') && !voice.members.has(self.user.id)) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.voice_is_full, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!query) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_search_track, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const is_url = new RegExp(`^https?:\/\/`).test(query)
    const { playableMusicHosts: allowed_hosts } = await self.db.json.get()

    if (is_url && !allowed_hosts.some(h => query.startsWith(h))) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.not_allowed_host, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!interaction.deferred) await interaction.deferReply()

    const search = await self.player.search(query, interaction.user.tag)

    if (search.loadType === 'LOAD_FAILED') {
        await interaction.editReply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.load_failed, `**${(interaction.member as any).displayName}**`)}` })

        return false
    }

    if (search.loadType === 'NO_MATCHES') {
        await interaction.editReply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.no_matches, `**${(interaction.member as any).displayName}**`)}` })

        return false
    }

    const player = self.player.create({
        guild: interaction.guild.id,
        voiceChannel: voice.id,
        textChannel: interaction.channelId,
        selfDeafen: true,
        volume: server.modules.music.default_volume
    })

    let message: Message

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
            await interaction.editReply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.playlist_loaded_no_premium, `**${(interaction.member as any).displayName}**`)}` })

            return false
        }

        for (const track of search.tracks.slice(0, 99)) await player.queue.add(track)

        const track = search.tracks[0]

        const embed = new MessageEmbed()
            .setTitle(locale.play.texts.player)
            .setDescription(`${track.title} \`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``)
            .setFooter(self.translator.format(locale.play.texts.added_by, track.requester))

        message = await interaction.editReply({ embeds: [embed], components: [row] }) as Message
    }

    if (search.loadType === 'TRACK_LOADED' || search.loadType === 'SEARCH_RESULT') {
        const track = search.tracks[0]

        if (player.queue.length >= server.modules.music.queue_max_length && server.modules.music.queue_max_length) {
            await interaction.editReply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.queue_limit_reached_no_premium, `**${(interaction.member as any).displayName}**`)}` })

            return false
        }

        if (track.isStream && !server.server.premium.available) {
            await interaction.editReply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.track_stream_only_for_premium, `**${(interaction.member as any).displayName}**`)}` })

            return false
        }

        if (track.isStream && !server.modules.music.allow_radio_playback) {
            await interaction.editReply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.play.texts.track_stream_disabled, `**${(interaction.member as any).displayName}**`)}` })

            return false
        }

        player.queue.add(track)

        const embed = new MessageEmbed()
            .setTitle(locale.play.texts.player)
            .setDescription(`${track.title} \`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``)
            .setFooter(self.translator.format(locale.play.texts.added_by, track.requester))

        if (player.playing) await interaction.editReply({ content: `${self._emojis.OK} | ${self.translator.format(locale.play.texts.added_to_queue, `**${(interaction.member as any).displayName}**`, `**${track.title}**`)}` })

        else {
            message = await interaction.editReply({ embeds: [embed], components: [row] }) as Message
        }
    }

    if (player.state != 'CONNECTED') player.connect()

    if (!player.playing && !player.paused) {
        if (!player.get('message')) player.set('message', message)

        await player.play()
        player.setQueueRepeat(true)

        const collector = message.createMessageComponentCollector({
            componentType: 'BUTTON',
            filter: i => row.components.some(c => c.customId == i.customId) && voice.members.has(i.user.id),
            time: 900000
        })

        if (!player.get('collector')) player.set('collector', collector)

        collector.on('collect', async i => {
            if (i.customId == row.components[0].customId) {
                if (player.queue.previous && player.position < 5000) {
                    await player.play(player.queue.previous)
                    player.queue.add(player.queue.previous, 0)
                }

                else if (player.queue.current.isSeekable) await player.seek(0)
            }

            if (i.customId == row.components[1].customId) {
                player.pause(!player.paused);
            
                (row.components[1] as any).setEmoji(player.paused ? '▶️' : '⏸️')
            }

            if (i.customId == row.components[2].customId) {
                if (player.playing && player.queue.current) await player.stop()
            }

            if (i.customId == row.components[3].customId) {
                if (player.trackRepeat) {
                    (row.components[3] as any).setEmoji('🔂')
                    player.setTrackRepeat(false)
                    player.setQueueRepeat(true)
                }

                else {
                    (row.components[3] as any).setEmoji('🔁')
                    player.setTrackRepeat(true)
                }
            }

            await message.edit({ components: [row] }).catch(() => {})
            await i.deferUpdate()

            collector.resetTimer()
        })

        collector.on('end', async () => await message.edit({ components: [] }).catch(() => {}) as any)
    }

    return true
}
