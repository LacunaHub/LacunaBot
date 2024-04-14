import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChannelType, Events, Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import Automoder from '../../modules/Automoder'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, before: Message, message: Message) => {
    if (message.author.bot || message.channel.type === ChannelType.DM) return false
    if ((!before.embeds.length && message.embeds.length) || (!before.pinned && message.pinned)) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })
    message = message.partial ? await message.fetch() : message

    await Automation.handleEvent('MESSAGE_UPDATE', self, server, message)
    await Automoder.antiCaps(self, server, message)
    await Automoder.linksFilter(self, server, message)
    await Automoder.swearFilter(self, server, message)
    await Logs.MessageUpdate(self, server, before, message)

    return true
}

export default {
    name: Events.MessageUpdate,
    handler
}
