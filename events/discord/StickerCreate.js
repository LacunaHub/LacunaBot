const { StickerCreate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Sticker} sticker
 */
 const handler = async (self, sticker) => {
    const server = await self.db.servers.find({ _id: sticker.guild.id })

    if (!server) return false

    await StickerCreate(self, server, sticker)

    return true
}

module.exports = {
    name: 'stickerCreate',
    handler
}