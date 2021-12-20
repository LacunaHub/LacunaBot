import { MessageReaction } from 'discord.js'
import { ReactionElement, ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, reaction: MessageReaction) => {
    let partial = reaction.partial

    reaction = partial ? (await reaction.fetch()) : reaction

    const message = reaction.message.partial ? (await reaction.message.fetch()) : reaction.message

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })
    const element: ReactionElement = server.modules.reactions.find(r => r.message.id == message.id && (r.emoji.id ? r.emoji.id == reaction.emoji.id : r.emoji.name == reaction.emoji.name))

    if (element) {
        await self.db.servers.updateOne({ _id: message.guild.id }, {
            $pull: {
                'modules.reactions': {
                    'id': element.id
                }
            }
        })
    }

    message.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)

    return true
}

export default {
    name: 'messageReactionRemoveEmoji',
    handler
}