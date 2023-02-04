import { Message } from 'discord.js'
import { Player } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, player: Player) => {
    const message = player.get<Message>('message')

    if (message) {
        await message.edit({ components: [] }).catch(() => {})
    }

    player.set('message', null)
    player.set('collector', null)
    await self.db.qdb.delete(`guildPlayers.${player.guild}`)

    self.logger.log(`[ErelaPlayerDestroy] Player ${player.guild} destroyed`)

    return true
}

export default {
    name: 'playerDestroy',
    handler
}
