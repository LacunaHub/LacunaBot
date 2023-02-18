import { Message } from 'discord.js'
import { Player } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, player: Player) {
    const message = player.get<Message>('message')
    const timeout = player.get<NodeJS.Timeout>('timeout')

    if (timeout) {
        clearTimeout(timeout)
        player.set('timeout', null)
    }

    if (message) {
        await self.db.qdb.set(`guildPlayers.${player.guild}`, {
            guildId: player.guild,
            voiceChannelId: player.voiceChannel,
            textChannelId: player.textChannel,
            messageId: message.id,
            volume: player.volume,
            trackRepeat: player.trackRepeat,
            queueRepeat: player.queueRepeat,
            queue: [player.queue.current, ...player.queue]
        })
    } else {
        await self.db.qdb.delete(`guildPlayers.${player.guild}`)
    }

    self.logger.log(`[ErelaTrackStart] Player ${player.guild} playback started`)
}

export default {
    name: 'trackStart',
    handler
}
