import { Events, GuildEmoji } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { EmojiDelete } from '../../modules/Logs'

const handler = async (self: Lacuna, emoji: GuildEmoji) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: emoji.guild.id })

    if (!server) return false

    await EmojiDelete(self, server, emoji)

    return true
}

export default {
    name: Events.GuildEmojiDelete,
    handler
}
