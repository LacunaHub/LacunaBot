import { type ServerModulesInteractiveReaction } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { Events, Message } from 'discord.js'

const handler = async (self: Lacuna, message: Message<true>) => {
    const server = await self.db.servers.fetch({ _id: message.guild.id })
    const elements: ServerModulesInteractiveReaction[] = server.modules.reactions.filter(
        r => r.message.id == message.id
    )

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
    name: Events.MessageReactionRemoveAll,
    handler
}
