import { ServerDocument, ServerModulesAutomationTriggers } from '@/database/schemas/Servers'
import { Events, Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/custom-behavior/Automation'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, message: Message) => {
    if (message.partial || message.author.bot || !message.inGuild()) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await Automation.handleEvent(ServerModulesAutomationTriggers.MessageDelete, self, server, message as Message<true>)
    await Logs.MessageDelete(self, server, message)

    return true
}

export default {
    name: Events.MessageDelete,
    handler
}
