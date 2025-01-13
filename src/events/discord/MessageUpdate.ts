import { ServerDocument, ServerModulesAutomationTriggers } from '@lacunahub/lacuna-database-driver'
import { ChannelType, Events, Message } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import AIMod from '../../modules/AIMod'
import AutoMod from '../../modules/AutoMod'
import Automation from '../../modules/custom-behavior/Automation'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, before: Message, message: Message) => {
    if (message.partial || message.author.bot || message.channel.type === ChannelType.DM) return false
    if ((!before.embeds.length && message.embeds.length) || before.pinned !== message.pinned) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await Automation.handleEvent(ServerModulesAutomationTriggers.MessageUpdate, self, server, message as Message<true>)
    await AIMod.handleMessageCreate(self, server, message)
    await AutoMod.moderateCaps(self, server, message)
    await AutoMod.moderateLinks(self, server, message)
    await AutoMod.moderateWords(self, server, message)
    await Logs.MessageUpdate(self, server, before, message)

    return true
}

export default {
    name: Events.MessageUpdate,
    handler
}
