const { StickerUpdate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Sticker} before
 * @param {import('discord.js').Sticker} sticker
 */
 const handler = async (self, before, sticker) => {
    const server = await self.db.servers.find({ _id: sticker.guild.id })

    if (!server) return false

    await StickerUpdate(self, server, before, sticker)

    return true
}

module.exports = {
    name: 'stickerUpdate',
    handler
}