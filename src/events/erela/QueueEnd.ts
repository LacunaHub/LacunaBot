import { Message } from 'discord.js'
import { Player } from 'erela.js'

const handler = async (self, player: Player) => {
    const message = player.get<Message>('message')

    if (message) {
        await message.edit({ components: [] }).catch(() => {})
    }

    player.set('message', null)

    return true
}

export default {
    name: 'queueEnd',
    handler
}
