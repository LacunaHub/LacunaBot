import { Message } from 'discord.js'
import { Player } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, player: Player) => {
    const message = player.get<Message>('message')

    if (message) {
        await message.edit({ components: [] }).catch(() => {})
    }

    player.set('message', null)
    player.set(
        'timeout',
        setTimeout(() => player.destroy(), 300000)
    )
    self.qdb.delete(`guildPlayers.${player.guild}`)

    self.logger.log(`[ErelaQueueEnd] Queue of player ${player.guild} ended`)

    return true
}

export default {
    name: 'queueEnd',
    handler
}
