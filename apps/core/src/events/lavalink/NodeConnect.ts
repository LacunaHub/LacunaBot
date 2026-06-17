import Lacuna from '@/internals/Lacuna.js'
import { Node, Player } from '@lacunahub/lavaluna.js'
import { BaseGuildTextChannel, BaseGuildVoiceChannel, Message } from 'discord.js'

async function handler(self: Lacuna, node: Node) {
    const guildPlayers = (await self.db.qdb.get('guildPlayers')) as any
    const guildIds = Object.keys(guildPlayers ?? {})

    const destroyPlayer = async (guildId: string, player?: Player) => {
        await self.db.qdb.delete(`guildPlayers.${guildId}`)
        if (player) player.destroy()
    }

    for (const guildId of guildIds) {
        let player = self.lava!.nodes.getPlayer(guildId)
        const guild = self.guilds.cache.get(guildId)

        if (!guild) {
            await destroyPlayer(guildId, player)
            continue
        }

        const guildPlayer = guildPlayers[guildId]
        const voiceChannel = guild.channels.cache.get(guildPlayer.voiceChannelId) as unknown as BaseGuildVoiceChannel,
            textChannel = guild.channels.cache.get(guildPlayer.textChannelId) as unknown as BaseGuildTextChannel
        let message!: Message

        if (textChannel?.messages) {
            try {
                message = await textChannel.messages.fetch({ message: guildPlayer.messageId })
            } catch (err) {
                self.logger.error({ module: 'MusicNodeConnect', action: 'FetchPlayerMessage', err, guildId: guildId })
            }
        }

        if (!voiceChannel || !message || voiceChannel.members.size < 1) {
            await destroyPlayer(guildId, player)
            continue
        }

        player = self.lava!.nodes.createPlayer({
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
        if (guildPlayer.trackRepeat) player.setRepeatMode('TRACK')
        if (guildPlayer.queueRepeat) player.setRepeatMode('QUEUE')

        if (player.voiceChannelId) player.connect()
        else player.setVoiceChannelId(voiceChannel.id)

        await player.play()
    }

    self.logger.info({ nodeName: node.options.name }, 'connected to lavalink node')

    return true
}

export default {
    name: 'nodeConnect',
    handler
}
