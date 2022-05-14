import { Sticker } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { StickerCreate } from '../../modules/Logs'

const handler = async (self: Lacuna, sticker: Sticker) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: sticker.guild.id })

    if (!server) return false

    await StickerCreate(self, server, sticker)

    return true
}

export default {
    name: 'stickerCreate',
    handler
}
