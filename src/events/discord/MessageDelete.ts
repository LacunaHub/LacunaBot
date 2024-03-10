import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChannelType, Events, Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, message: Message) => {
    if (message.partial || message.author.bot || message.channel.type == ChannelType.DM) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await Automation.handleEvent('MESSAGE_DELETE', self, server, message)
    await Logs.MessageDelete(self, server, message)

    return true
}

export default {
    name: Events.MessageDelete,
    handler
}
