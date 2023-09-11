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
                module: 'MusicQueueEnd',
                action: 'RemoveComponentsFromPlayerMessage',
                error: err,
                guild_id: player.guild
            })
        }
    }

    player.set('message', null)
    player.set(
        'timeout',
        setTimeout(() => player.destroy(), 300000)
    )
    await self.db.qdb.delete(`guildPlayers.${player.guild}`)

    self.logger.log(`[ErelaQueueEnd] Queue of player ${player.guild} ended`)
    await self.logger.appendServerLog(player.guild, {
        level: 'LOG',
        module: 'Music',
        action: 'QueueEnd',
        message: 'The player queue has ended'
    })

    return true
}

export default {
    name: 'queueEnd',
    handler
}
