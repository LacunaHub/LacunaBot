import { Node } from '@lacunahub/lavaluna.js'
import { BaseGuildTextChannel, BaseGuildVoiceChannel, Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, node: Node) {
    const guildPlayers = (await self.db.qdb.get('guildPlayers')) as any
    const guildIds = Object.keys(guildPlayers ?? {})

    for (const guildId of guildIds) {
        let player = self.lava.nodes.getPlayer(guildId)
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

        player = self.lava.nodes.createPlayer({
            guildId: guild.id,
            voiceChannelId: voiceChannel.id,
            textChannelId: textChannel.id,
            selfDeafen: true,
            volume: guildPlayer.volume
        })

        if (player.queue.length + 1 === 0) {
            player.queue.add(guildPlayer.queue)
        }

        player.set('message', message)
        player.setVolume(guildPlayer.volume)
        if (guildPlayer.trackRepeat) player.setTrackRepeat(guildPlayer.trackRepeat)
        if (guildPlayer.queueRepeat) player.setQueueRepeat(guildPlayer.queueRepeat)

        if (player.voiceChannelId) player.connect()
        else player.setVoiceChannelId(voiceChannel.id)

        await player.play()
    }

    self.logger.log(`[LavaNodeConnect] Successfully connected to ${node.options.name} node`)

    return true
}

export default {
    name: 'nodeConnect',
    handler
}
