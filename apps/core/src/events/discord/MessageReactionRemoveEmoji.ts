import Lacuna from '@/internals/Lacuna.js'
import { Events, MessageReaction } from 'discord.js'

const handler = async (self: Lacuna, reaction: MessageReaction) => {
    reaction = reaction.partial ? await reaction.fetch() : reaction
    const message = reaction.message

    const server = await self.db.servers.fetch({ _id: message.guildId! })
    const element = server.modules.reactions.find(
        r =>
            r.message.id == message.id &&
            (r.emoji.id ? r.emoji.id == reaction.emoji.id : r.emoji.name == reaction.emoji.name)
    )

    if (element) {
        await self.db.servers.updateOne(
            { _id: message.guildId! },
            {
                $pull: {
                    'modules.reactions': {
                        id: element.id
                    }
                }
            }
        )
    }

    return true
}

export default {
    name: Events.MessageReactionRemoveEmoji,
    handler
}
