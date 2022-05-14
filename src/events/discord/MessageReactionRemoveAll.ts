import { Message } from 'discord.js'
import { ReactionElement, ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, message: Message) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })
    const elements: ReactionElement[] = server.modules.reactions.filter(r => r.message.id == message.id)

    if (elements.length) {
        await self.db.servers.updateOne(
            { _id: message.guild.id },
            {
                $pull: {
                    'modules.reactions': {
                        'message.id': message.id
                    }
                }
            }
        )
    }

    message.reactions.cache.clear()

    return true
}

export default {
    name: 'messageReactionRemoveAll',
    handler
}
