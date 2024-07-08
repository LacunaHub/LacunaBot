import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChannelType, Events, Message, MessageType } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import { fetchGuild } from '../../internals/utility/Utils'
import AutoMod from '../../modules/AutoMod'
import Automation from '../../modules/Automation'
import { messageCreate as addWalletCash } from '../../modules/Economy'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Levels from '../../modules/Levels'
import { addAutoReactions, createAutoThread } from '../../modules/Useful'

const handler = async (self: Lacuna, message: Message) => {
    if (message.author.bot || message.channel.type === ChannelType.DM) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    if (server.blocked) {
        await message.guild.leave()

        return false
    }

    await fetchGuild(self.cache, message.guild)
    await Automation.handleEvent('MESSAGE_CREATE', self, server, message)

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
