import { ServerModulesAutomationTriggers } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import AIMod from '@/modules/AIMod/index.js'
import AutoMod from '@/modules/AutoMod/index.js'
import Automation from '@/modules/custom-behavior/Automation.js'
import Logs from '@/modules/Logs/index.js'
import { ChannelType, Events, Message } from 'discord.js'

const handler = async (self: Lacuna, before: Message, message: Message) => {
    if (message.partial || message.author.bot || message.channel.type === ChannelType.DM) return false
    if ((!before.embeds.length && message.embeds.length) || before.pinned !== message.pinned) return false

    const server = await self.db.servers.fetch({ _id: message.guild!.id })

    await Automation.handleEvent(ServerModulesAutomationTriggers.MessageUpdate, self, server, message as Message<true>)
    await AIMod.handleMessageCreate(self, server, message as any)
    await AutoMod.moderateCaps(self, server, message as any)
    await AutoMod.moderateLinks(self, server, message as any)
    await AutoMod.moderateWords(self, server, message as any)
    await Logs.MessageUpdate(self, server, before, message as any)

    return true
}

export default {
    name: Events.MessageUpdate,
    handler
}
