import { MessageReaction, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { reactionRemove } from '../../modules/Reactions'

const handler = async (self: Lacuna, reaction: MessageReaction, user: User) => {
    if (self.user.id == user.id) return false
    
    let partial = reaction.partial

    reaction = partial ? (await reaction.fetch()) : reaction

    const message = reaction.message.partial ? (await reaction.message.fetch()) : reaction.message

    if (message.channel.type == 'DM') return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await reactionRemove(self, server, reaction, user)

    if (partial) {
        message.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)
        message.channel.messages.cache.delete(message.id)
    }

    return true
}

export default {
    name: 'messageReactionRemove',
    handler
}