import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { lavalinkSources } from '@/internals/utility/Constants.js'
import { capitalizeFirstLetter, getTrackSourceByUrl } from '@/internals/utility/Utils.js'
import { type SearchResult } from '@lacunahub/lavaluna.js'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Message
} from 'discord.js'
import numbro from 'numbro'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const query = interaction.options?.getString('query')
    const voice = interaction.member.voice?.channel

    if (!voice) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.YouNeedToConnectToVoiceChannel', {
                username: `**${interaction.member.displayName}**`
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
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.PlayCommand.Texts.PlaybackIsDisallowedInVoiceChannel',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    const has_permissions = voice
        .permissionsFor(interaction.guild.members.me!)
        .has(['ViewChannel', 'Connect', 'Speak', 'UseVAD'])

    if (!has_permissions) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.PlayCommand.Texts.MissingRequiredPermissionsInVoiceChannel',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    if (
        voice.full &&
        !voice.permissionsFor(interaction.guild.members.me!).has('MoveMembers') &&
        !voice.members.has(self.user!.id)
    ) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.VoiceChannelIsFull', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!query) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.NoQuery', { username: `**${interaction.member.displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const is_url = new RegExp(`^https?:\/\/`).test(query)
    const { allowedMusicHosts } = await self.db.getInternalData()

    if (is_url && !allowedMusicHosts?.some(h => query.startsWith(h))) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.HostIsNotAllowedToBePlayed', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply()
    let search!: SearchResult

    try {
        search = await self.lava!.search(
            { query, source: lavalinkSources[server.modules.music.default_source] },
            { requester: interaction.user.tag }
        )
    } catch (err) {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.TrackLoadFailed', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        self.logger.error({ module: 'PlayCommand', action: 'Search', err, guildId: interaction.guildId })

        return false
    }

    if (search.loadType === 'error') {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.TrackLoadFailed', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    if (search.loadType === 'empty') {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.NoMatches', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    const player = self.lava!.nodes.createPlayer({
            guildId: interaction.guild.id,
            voiceChannelId: voice.id,
            textChannelId: interaction.channelId,
            selfDeafen: true,
            volume: server.modules.music.default_volume
        }),
        queueMaxLength = server.premium.available ? server.modules.music.queue_max_length : 15

    let message!: Message

    const rows = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('PLAYER-SHUFFLE-PLAY')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.Shuffle!),
            new ButtonBuilder()
                .setCustomId('PLAYER-PREVIOUS')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.StepBackward!),
            new ButtonBuilder()
                .setCustomId('PLAYER-PAUSE-RESUME')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.Pause!),
            new ButtonBuilder()
                .setCustomId('PLAYER-SKIP')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.StepForward!),
            new ButtonBuilder()
                .setCustomId('PLAYER-REPEAT')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.ArrowRight!)
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('PLAYER-VOLUME-DOWN')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.VolumeDown!),
            new ButtonBuilder()
                .setCustomId('PLAYER-SEEK-REWIND')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.Rewind!),
            new ButtonBuilder()
                .setCustomId('PLAYER-STOP')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.Stop!),
            new ButtonBuilder()
                .setCustomId('PLAYER-SEEK-FAST-FORWARD')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.FastForward!),
            new ButtonBuilder()
                .setCustomId('PLAYER-VOLUME-UP')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.VolumeUp!)
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('PLAYER-QUEUE')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.MusicQueue!),
            new ButtonBuilder()
                .setCustomId('PLAYER-FILTERS')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(self.staticEmojis.Sliders!)
        )
    ]

    if (search.loadType === 'playlist') {
        if (!server.premium.available) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t(
                    'Commands.PlayCommand.Texts.PlaylistsAvailableOnlyForPremium',
                    {
                        username: `**${interaction.member.displayName}**`
                    }
                )}`
            })

            return false
        }

        if (player.queue.length >= queueMaxLength && queueMaxLength) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.QueueLimitReached', {
                    username: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        player.queue.add(search.tracks.slice(0, queueMaxLength || 250))

        const track = search.tracks[0]!
        const trackSource = getTrackSourceByUrl(track.info.uri!)

        const embed = new EmbedBuilder()
            .setTitle(`${track.info.author} - ${track.info.title}`)
            .addFields([
                {
                    name: capitalizeFirstLetter(t('Commands.Options.Duration')),
                    value: track.info.isStream
                        ? '♾️'
                        : // @ts-expect-error
                          `\`[${numbro(track.info.length / 1000).format({ output: 'time' })}]\``,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: `${self.staticEmojis.StepForward} ${
                        track.info.isStream ? '♾️' : `<t:${Math.round((Date.now() + track.info.length) / 1000)}:R>`
                    }`,
                    inline: true
                },
                {
                    name: capitalizeFirstLetter(t('Commands.Options.Source')),
                    value: `[${self.staticEmojis[trackSource.toUpperCase()] ?? ''} ${trackSource}](${track.info.uri})`,
                    inline: true
                }
            ])
            .setFooter({ text: t('Commands.PlayCommand.Texts.AddedBy', { requester: track.requester }) })

        if (track.info.artworkUrl) {
            embed.setThumbnail(track.info.artworkUrl)
        }

        if (player.playing || player.paused)
            await interaction.editReply({
                content: `${self.staticEmojis.Check} | ${t('Commands.PlayCommand.Texts.PlaylistHasBeenAddedToQueue', {
                    username: `**${interaction.member.displayName}**`,
                    playlist: `**${search.playlist!.name}**`
                })}`
            })
        else {
            message = (await interaction.editReply({ embeds: [embed], components: rows })) as Message
        }
    }

    if (search.loadType === 'track' || search.loadType === 'search') {
        const track = search.tracks[0]!
        const trackSource = getTrackSourceByUrl(track.info.uri!)

        if (player.queue.length >= queueMaxLength && queueMaxLength) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.QueueLimitReached', {
                    username: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        if (track.info.isStream && !server.premium.available) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t(
                    'Commands.PlayCommand.Texts.StreamPlaybackAvailableOnlyForPremium',
                    {
                        username: `**${interaction.member.displayName}**`
                    }
                )}`
            })

            return false
        }

        if (track.info.isStream && !server.modules.music.allow_radio_playback) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.PlayCommand.Texts.StreamPlaybackIsDisabled', {
                    username: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        player.queue.add(track)

        const embed = new EmbedBuilder()
            .setTitle(`${track.info.author} - ${track.info.title}`)
            .addFields([
                {
                    name: capitalizeFirstLetter(t('Commands.Options.Duration')),
                    value: track.info.isStream
                        ? '♾️'
                        : // @ts-expect-error
                          `\`[${numbro(track.info.length / 1000).format({ output: 'time' })}]\``,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: `${self.staticEmojis.StepForward} ${
                        track.info.isStream ? '♾️' : `<t:${Math.round((Date.now() + track.info.length) / 1000)}:R>`
                    }`,
                    inline: true
                },
                {
                    name: capitalizeFirstLetter(t('Commands.Options.Source')),
                    value: `[${self.staticEmojis[trackSource.toUpperCase()] ?? ''} ${trackSource}](${track.info.uri})`,
                    inline: true
                }
            ])
            .setFooter({ text: t('Commands.PlayCommand.Texts.AddedBy', { requester: track.requester }) })

        if (track.info.artworkUrl) {
            embed.setThumbnail(track.info.artworkUrl)
        }

        if (player.playing || player.paused)
            await interaction.editReply({
                content: `${self.staticEmojis.Check} | ${t('Commands.PlayCommand.Texts.TrackHasBeenAddedToQueue', {
                    username: `**${interaction.member.displayName}**`,
                    track: `**${track.info.author} - ${track.info.title}**`
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
