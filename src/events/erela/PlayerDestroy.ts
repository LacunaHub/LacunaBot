import { Message } from 'discord.js'
import { Player } from 'erela.js'

const handler = async (self, player: Player) => {
    const message = player.get<Message>('message')

    if (message && !message.deleted) {
        await message.edit({ components: [] }).catch(() => {})
    }

    player.set('message', null)
    player.set('collector', null)

    return true
}

export default {
    name: 'playerDestroy',
    handler
}