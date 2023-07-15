import { BaseGuildTextChannel, BaseGuildVoiceChannel, Message } from 'discord.js'
import { Node, Track, TrackUtils } from 'erela.js'
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
                self.logger.handleError({ module: 'NodeConnect', action: 'FetchPlayerMessage', error: err, guild_id: guildId })
            }
        }

        if (!voiceChannel || !message || voiceChannel.members.size < 1) {
            if (player) player.destroy()

            continue
        }

        player = self.player.create({
            guild: guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: textChannel.id,
            selfDeafen: true,
            volume: guildPlayer.volume
        })

        if (player.queue.totalSize === 0) {
            player.queue.add(
                guildPlayer.queue.map((i: Track) => {
                    return TrackUtils.build(
                        {
                            track: i.track,
                            info: {
                                author: i.author,
                                identifier: i.identifier,
                                isSeekable: i.isSeekable,
                                isStream: i.isStream,
                                length: i.duration,
                                title: i.title,
                                uri: i.uri
                            }
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

        if (player.voiceChannel) player.connect()
        else player.setVoiceChannel(voiceChannel.id)

        await player.play()
    }

    self.logger.log(`[ErelaNodeConnect] Successfully connected to ${node.options.identifier} node`)

    return true
}

export default {
    name: 'nodeConnect',
    handler
}
