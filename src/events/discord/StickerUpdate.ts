import { Sticker } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { StickerUpdate } from '../../modules/Logs'

const handler = async (self: Lacuna, before: Sticker, sticker: Sticker) => {
    const server: ServerDocument = await self.db.servers.findOne({ _id: sticker.guild.id })

    if (!server) return false

    await StickerUpdate(self, server, before, sticker)

    return true
}

export default {
    name: 'stickerUpdate',
    handler
}