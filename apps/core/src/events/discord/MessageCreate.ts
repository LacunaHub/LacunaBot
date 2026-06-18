import { ServerModulesAutomationTriggers } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import AIMod from '@/modules/AIMod/index.js'
import AutoMod from '@/modules/AutoMod/index.js'
import Automation from '@/modules/custom-behavior/Automation.js'
import { messageCreate as addWalletCash } from '@/modules/Economy.js'
import GuildImageRotation from '@/modules/GuildImageRotation.js'
import Levels from '@/modules/Levels.js'
import { addAutoReactions, createAutoThread } from '@/modules/Useful.js'
import { Events, Message, MessageType } from 'discord.js'

const handler = async (self: Lacuna, message: Message) => {
    if (message.author.bot || !message.inGuild()) return false

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    if (server.blocked) {
        await message.guild.leave()

        return false
    }

    await self.fetchGuild(message.guild)
    await Automation.handleEvent(ServerModulesAutomationTriggers.MessageCreate, self, server, message as Message<true>)
    await AIMod.handleMessageCreate(self, server, message)

    if ([MessageType.Default, MessageType.Reply].includes(message.type)) {
        await Levels.onMessageCreate(self, server, message)
        await addWalletCash(self, server, message)
    }

    await AutoMod.moderateCaps(self, server, message)
    await AutoMod.moderateLinks(self, server, message)
    await AutoMod.moderateNicknames(self, server, message.member!)
    await AutoMod.moderateWords(self, server, message)
    await AutoMod.slowdownUsers(self, server, message)
    await addAutoReactions(self, server, message)
    await createAutoThread(self, server, message)
    await GuildImageRotation.rotateBanner(self, server, message.guild, message.member!)

    return true
}

export default {
    name: Events.MessageCreate,
    handler
}
