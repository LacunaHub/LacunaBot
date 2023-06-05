import { ChannelType, Events, Message, MessageType } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import { antiCaps, linksFilter, nicknamesModeration, swearFilter, usersSlowdown } from '../../modules/Automoder'
import { messageCreate as addWalletCash } from '../../modules/Economy'
import { messageCreate as addLevelPoints } from '../../modules/Levels'
import { autoReact } from '../../modules/Reactions'
import { autoThread } from '../../modules/Threads'

const handler = async (self: Lacuna, message: Message) => {
    if (message.author.bot || message.channel.type == ChannelType.DM) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    if (server.server.blocked) {
        await message.guild.leave()

        return false
    }

    await message.member.fetch()

    if ([MessageType.Default, MessageType.Reply].includes(message.type)) {
        await addLevelPoints(self, server, message)
        await addWalletCash(self, server, message)
    }

    await antiCaps(self, server, message)
    await linksFilter(self, server, message)
    await nicknamesModeration(self, server, message.member)
    await swearFilter(self, server, message)
    await usersSlowdown(self, server, message)

    await autoThread(self, server, message)
    await autoReact(self, server, message)
    await Automation.handleEvent('MESSAGE_CREATE', self, server, message)

    return true
}

export default {
    name: Events.MessageCreate,
    handler
}
