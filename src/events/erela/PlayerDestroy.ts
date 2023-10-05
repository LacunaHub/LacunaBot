import { Message } from 'discord.js'
import { Player } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, player: Player) => {
    const message = player.get<Message>('message')

    if (message) {
        try {
            await message.edit({ components: [] })
        } catch (err) {
            await self.logger.handleError({
                module: 'MusicPlayerDestroy',
                action: 'RemoveComponentsFromPlayerMessage',
                error: err,
                guild_id: player.guildId
            })
        }
    }

    player.set('message', null)
    player.set('collector', null)
    await self.db.qdb.delete(`guildPlayers.${player.guildId}`)

    self.logger.log(`[ErelaPlayerDestroy] Player ${player.guildId} destroyed`)
    await self.logger.appendServerLog(player.guildId, {
        level: 'LOG',
        module: 'Music',
        action: 'PlayerDestroy',
        message: 'Player destroyed'
    })

    return true
}

export default {
    name: 'playerDestroy',
    handler
}
