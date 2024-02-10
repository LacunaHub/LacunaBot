import { BaseGuildTextChannel, BaseGuildVoiceChannel, Message } from 'discord.js'
import { Node, PlayerTrack, TrackUtils } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, node: Node) {
    const guildPlayers = (await self.db.qdb.get('guildPlayers')) as any
    const guildIds = Object.keys(guildPlayers ?? {})

    for (const guildId of guildIds) {
        let player = self.player.players.get(guildId)
        const guild = self.guilds.cache.get(guildId)

        if (!guild) {
            if (player) player.destroy()

            continue
        }

        const guildPlayer = guildPlayers[guildId]
        const voiceChannel = guild.channels.cache.get(guildPlayer.voiceChannelId) as BaseGuildVoiceChannel,
            textChannel = guild.channels.cache.get(guildPlayer.textChannelId) as BaseGuildTextChannel
        let message: Message

        if (textChannel?.messages) {
            try {
                message = await textChannel.messages.fetch({ message: guildPlayer.messageId })
            } catch (err) {
                await self.logger.handleError({ module: 'MusicNodeConnect', action: 'FetchPlayerMessage', error: err, guild_id: guildId })
            }
        }

        if (!voiceChannel || !message || voiceChannel.members.size < 1) {
            if (player) await player.destroy()

            continue
        }

        player = self.player.create({
            guildId: guild.id,
            voiceChannelId: voiceChannel.id,
            textChannelId: textChannel.id,
            selfDeafen: true,
            volume: guildPlayer.volume
        })

        if (player.queue.totalSize === 0) {
            player.queue.add(
                guildPlayer.queue.map((i: PlayerTrack) => {
                    return TrackUtils.build(
                        {
                            encoded: i.track,
                            info: {
                                identifier: i.identifier,
                                isSeekable: i.isSeekable,
                                author: i.author,
                                length: i.duration,
                                isStream: i.isStream,
                                position: i.position,
                                title: i.title,
                                uri: i.uri,
                                artworkUrl: i.artworkUrl,
                                isrc: i.isrc,
                                sourceName: i.sourceName
                            },
                            pluginInfo: {},
                            userData: {}
                        },
                        i.requester
                    )
                })
            )
        }

        player.set('message', message)
        player.setVolume(guildPlayer.volume)
        if (guildPlayer.trackRepeat) player.setTrackRepeat(guildPlayer.trackRepeat)
        if (guildPlayer.queueRepeat) player.setQueueRepeat(guildPlayer.queueRepeat)

        if (player.voiceChannelId) player.connect()
        else player.setVoiceChannelId(voiceChannel.id)

        await player.play()
    }

    self.logger.log(`[ErelaNodeConnect] Successfully connected to ${node.options.identifier} node`)

    return true
}

export default {
    name: 'nodeConnect',
    handler
}
