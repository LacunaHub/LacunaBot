import { ServerModulesAutomationTriggers } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import Automation from '@/modules/custom-behavior/Automation.js'
import Logs from '@/modules/Logs/index.js'
import { Events, Message } from 'discord.js'

const handler = async (self: Lacuna, message: Message) => {
    if (message.partial || message.author.bot || !message.inGuild()) return false

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    await Automation.handleEvent(ServerModulesAutomationTriggers.MessageDelete, self, server, message as Message<true>)
    await Logs.MessageDelete(self, server, message)

    return true
}

export default {
    name: Events.MessageDelete,
    handler
}
