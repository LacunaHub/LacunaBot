import { Player } from '@lacunahub/lavaluna.js'
import { Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, player: Player) {
    const message = player.get<Message>('message'),
        timeout = player.get<NodeJS.Timeout>('timeout'),
        track = player.queue.current

    if (timeout) {
        clearTimeout(timeout)
        player.set('timeout', null)
    }

    if (message) {
        await self.db.qdb.set(`guildPlayers.${player.guildId}`, {
            guildId: player.guildId,
            voiceChannelId: player.voiceChannelId,
            textChannelId: player.textChannelId,
            messageId: message.id,
            volume: player.volume,
            trackRepeat: player.trackRepeat,
            queueRepeat: player.queueRepeat,
            queue: [player.queue.current, ...player.queue]
        })
    } else {
        await self.db.qdb.delete(`guildPlayers.${player.guildId}`)
    }

    self.logger.log(`[LavaTrackStart] Player ${player.guildId} playback started`)
    await self.logger.appendServerLog(player.guildId, {
        level: 'LOG',
        module: 'Music',
        action: 'TrackEnd',
        message: `Track "${track.info.author} - ${track.info.title}" is playing now`
    })
}

export default {
    name: 'trackStart',
    handler
}
