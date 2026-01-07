import { ServerDocument, ServerModulesAutomationTriggers } from '@/database/schemas/Servers'
import { Events, Message, MessageType } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import AIMod from '../../modules/AIMod'
import AutoMod from '../../modules/AutoMod'
import Automation from '../../modules/custom-behavior/Automation'
import { messageCreate as addWalletCash } from '../../modules/Economy'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Levels from '../../modules/Levels'
import { addAutoReactions, createAutoThread } from '../../modules/Useful'

const handler = async (self: Lacuna, message: Message) => {
    if (message.author.bot || !message.inGuild()) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

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
    await AutoMod.moderateNicknames(self, server, message.member)
    await AutoMod.moderateWords(self, server, message)
    await AutoMod.slowdownUsers(self, server, message)
    await addAutoReactions(self, server, message)
    await createAutoThread(self, server, message)
    await GuildImageRotation.rotateBanner(self, server, message.guild, message.member)

    return true
}

export default {
    name: Events.MessageCreate,
    handler
}
