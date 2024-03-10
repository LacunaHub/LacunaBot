import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChannelType, Events, MessageReaction, User } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import InteractiveMessages from '../../modules/InteractiveMessages'
import { reactionAdd } from '../../modules/Reactions'

const handler = async (self: Lacuna, reaction: MessageReaction, user: User) => {
    if (self.user.id === user.id) return false

    reaction = reaction.partial ? await reaction.fetch() : reaction
    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message

    if (message.channel.type === ChannelType.DM) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await reactionAdd(self, server, reaction, user)
    await InteractiveMessages.handleReactionAdd(self, server, reaction, user)

    return true
}

export default {
    name: Events.MessageReactionAdd,
    handler
}
