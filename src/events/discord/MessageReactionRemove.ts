import { ServerDocument, ServerModulesAutomationTriggers } from '@lacunahub/lacuna-database-driver'
import { Events, Message, MessageReaction, User } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import InteractiveMessages from '../../modules/InteractiveMessages'
import InteractiveReactions from '../../modules/InteractiveReactions'
import Automation from '../../modules/custom-behavior/Automation'

const handler = async (self: Lacuna, reaction: MessageReaction, user: User) => {
    if (self.user.id === user.id || !reaction.message?.inGuild()) return false

    reaction = reaction.partial ? await reaction.fetch() : reaction
    const server: ServerDocument = await self.db.servers.fetch({ _id: reaction.message.guildId })

    await Automation.handleEvent(ServerModulesAutomationTriggers.MessageReactionRemove, self, server, reaction.message as Message<true>, {
        overwriteSignalProps: { lastReaction: `${user.id}/${reaction.emoji.identifier}` }
    })
    await InteractiveMessages.handleReactionRemove(self, server, reaction, user)
    await InteractiveReactions.handleReactionRemove(self, server, reaction, user)

    return true
}

export default {
    name: Events.MessageReactionRemove,
    handler
}
