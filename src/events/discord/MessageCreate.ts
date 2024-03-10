import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChannelType, Events, Message, MessageType } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import Automoder from '../../modules/Automoder'
import { messageCreate as addWalletCash } from '../../modules/Economy'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Levels from '../../modules/Levels'
import { autoReact } from '../../modules/Reactions'
import { autoThread } from '../../modules/Threads'

const handler = async (self: Lacuna, message: Message) => {
    if (message.author.bot || message.channel.type === ChannelType.DM) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    if (server.blocked) {
        await message.guild.leave()

        return false
    }

    await Automation.handleEvent('MESSAGE_CREATE', self, server, message)

    if ([MessageType.Default, MessageType.Reply].includes(message.type)) {
        await Levels.onMessageCreate(self, server, message)
        await addWalletCash(self, server, message)
    }

    await Automoder.antiCaps(self, server, message)
    await Automoder.linksFilter(self, server, message)
    await Automoder.nicknamesModeration(self, server, message.member)
    await Automoder.swearFilter(self, server, message)
    await Automoder.usersSlowdown(self, server, message)
    await autoThread(self, server, message)
    await autoReact(self, server, message)
    await GuildImageRotation.rotateBanner(self, server, message.guild, message.member)

    return true
}

export default {
    name: Events.MessageCreate,
    handler
}
