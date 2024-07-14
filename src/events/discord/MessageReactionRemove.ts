import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChannelType, Events, MessageReaction, User } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import InteractiveMessages from '../../modules/InteractiveMessages'
import InteractiveReactions from '../../modules/InteractiveReactions'

const handler = async (self: Lacuna, reaction: MessageReaction, user: User) => {
    if (self.user.id === user.id) return false
    if (reaction.message?.channel?.type === ChannelType.DM) return false

    reaction = reaction.partial ? await reaction.fetch() : reaction

    const server: ServerDocument = await self.db.servers.fetch({ _id: reaction.message.guildId })

    await InteractiveMessages.handleReactionRemove(self, server, reaction, user)
    await InteractiveReactions.handleReactionRemove(self, server, reaction, user)

    return true
}

export default {
    name: Events.MessageReactionRemove,
    handler
}
