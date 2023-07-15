import { Events, GuildEmoji } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, before: GuildEmoji, emoji: GuildEmoji) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: emoji.guild.id })

    if (!server) return false

    await Logs.EmojiUpdate(self, server, before, emoji)

    return true
}

export default {
    name: Events.GuildEmojiUpdate,
    handler
}
