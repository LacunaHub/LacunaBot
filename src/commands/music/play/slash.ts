import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message } from 'discord.js'
import { SearchResult } from 'erela.js'
import numbro from 'numbro'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { lavalinkSources } from '../../../internals/utility/Constants'
import { capitalizeFirstLetter, getTrackSourceByUrl } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const query = interaction.options?.getString('query')
    const voice = (interaction.member as GuildMember).voice?.channel

    if (!voice) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_connect_to_voice', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (
        (server.modules.music.allowed.channels.length && !server.modules.music.allowed.channels.includes(voice.id)) ||
        server.modules.music.blocked.channels.includes(voice.id)
    ) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_disallowed_voice', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const has_permissions = voice.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'Connect', 'Speak', 'UseVAD'])

    if (!has_permissions) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_no_required_permissions_in_voice', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (voice.full && !voice.permissionsFor(interaction.guild.members.me).has('MoveMembers') && !voice.members.has(self.user.id)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_voice_is_full', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!query) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_no_search_track', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const is_url = new RegExp(`^https?:\/\/`).test(query)
    const { playableMusicHosts: allowed_hosts } = await self.db.json.get()

    if (is_url && !allowed_hosts.some(h => query.startsWith(h))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_not_allowed_host', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply()
    let search: SearchResult

    try {
        search = await self.player.search({ query, source: lavalinkSources[server.modules.music.default_source] }, interaction.user.tag)
    } catch (err) {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_load_failed', { user: `**${(interaction.member as any).displayName}**` })}`
        })

        return false
    }

    if (search.loadType === 'LOAD_FAILED') {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_load_failed', { user: `**${(interaction.member as any).displayName}**` })}`
        })

        return false
    }

    if (search.loadType === 'NO_MATCHES') {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.play.text_no_matches', { user: `**${(interaction.member as any).displayName}**` })}`
        })

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

    const rows = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('PLAYER-STOP').setStyle(ButtonStyle.Secondary).setEmoji('⏹️'),
            new ButtonBuilder().setCustomId('PLAYER-PREVIOUS').setStyle(ButtonStyle.Secondary).setEmoji('⏮️'),
            new ButtonBuilder().setCustomId('PLAYER-PAUSE-RESUME').setStyle(ButtonStyle.Secondary).setEmoji('⏸️'),
            new ButtonBuilder().setCustomId('PLAYER-SKIP').setStyle(ButtonStyle.Secondary).setEmoji('⏭️'),
            new ButtonBuilder().setCustomId('PLAYER-REPEAT').setStyle(ButtonStyle.Secondary).setEmoji('➡️')
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('PLAYER-QUEUE').setStyle(ButtonStyle.Secondary).setEmoji('🎶'),
            new ButtonBuilder().setCustomId('PLAYER-VOLUME-DOWN').setStyle(ButtonStyle.Secondary).setEmoji('🔉'),
            new ButtonBuilder().setCustomId('PLAYER-VOLUME-UP').setStyle(ButtonStyle.Secondary).setEmoji('🔊')
        )
    ]

    if (search.loadType === 'PLAYLIST_LOADED') {
        if (!server.server.premium.available) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.play.text_playlist_loaded_no_premium', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`
            })

            return false
        }

        if (player.queue.length >= server.modules.music.queue_max_length && server.modules.music.queue_max_length) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.play.text_queue_limit_reached_no_premium', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`
            })

            return false
        }

        player.queue.add(search.tracks.slice(0, server.modules.music.queue_max_length || 99))

        const track = search.tracks[0]
        const trackSource = getTrackSourceByUrl(track.uri)

        const embed = new EmbedBuilder()
            .setTitle(`${track.author} - ${track.title}`)
            .addFields([
                {
                    name: capitalizeFirstLetter(t('common.command_options.duration')),
                    value: track.isStream ? '♾️' : `\`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: `⏭️ ${track.isStream ? '♾️' : `<t:${Math.round((Date.now() + track.duration) / 1000)}:R>`}`,
                    inline: true
                },
                {
                    name: t('commands.play.text_source'),
                    value: `[${self._emojis[trackSource.toUpperCase()] ?? ''} ${trackSource}](${track.uri})`,
                    inline: true
                }
            ])
            .setFooter({ text: t('commands.play.text_added_by', { requester: track.requester }) })

        if (player.playing || player.paused)
            await interaction.editReply({
                content: `${self._emojis.OK} | ${t('commands.play.text_playlist_added_to_queue', {
                    user: `**${(interaction.member as any).displayName}**`,
                    playlist: `**${search.playlist.name}**`
                })}`
            })
        else {
            message = (await interaction.editReply({ embeds: [embed], components: rows })) as Message
        }
    }

    if (search.loadType === 'TRACK_LOADED' || search.loadType === 'SEARCH_RESULT') {
        const track = search.tracks[0]
        const trackSource = getTrackSourceByUrl(track.uri)

        if (player.queue.length >= server.modules.music.queue_max_length && server.modules.music.queue_max_length) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.play.text_queue_limit_reached_no_premium', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`
            })

            return false
        }

        if (track.isStream && !server.server.premium.available) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.play.text_track_stream_only_for_premium', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`
            })

            return false
        }

        if (track.isStream && !server.modules.music.allow_radio_playback) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.play.text_track_stream_disabled', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`
            })

            return false
        }

        player.queue.add(track)

        const embed = new EmbedBuilder()
            .setTitle(`${track.author} - ${track.title}`)
            .addFields([
                {
                    name: capitalizeFirstLetter(t('common.command_options.duration')),
                    value: track.isStream ? '♾️' : `\`[${numbro(track.duration / 1000).format({ output: 'time' })}]\``,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: `⏭️ ${track.isStream ? '♾️' : `<t:${Math.round((Date.now() + track.duration) / 1000)}:R>`}`,
                    inline: true
                },
                {
                    name: t('commands.play.text_source'),
                    value: `[${self._emojis[trackSource.toUpperCase()] ?? ''} ${trackSource}](${track.uri})`,
                    inline: true
                }
            ])
            .setFooter({ text: t('commands.play.text_added_by', { requester: track.requester }) })

        if (player.playing || player.paused)
            await interaction.editReply({
                content: `${self._emojis.OK} | ${t('commands.play.text_track_added_to_queue', {
                    user: `**${(interaction.member as any).displayName}**`,
                    track: `**${track.author} - ${track.title}**`
                })}`
            })
        else {
            message = (await interaction.editReply({ embeds: [embed], components: rows })) as Message
        }
    }

    if (player.state !== 'CONNECTED') player.connect()

    if (!player.playing && !player.paused) {
        if (!player.get('message')) player.set('message', message)

        await player.play()
    }

    return true
}
