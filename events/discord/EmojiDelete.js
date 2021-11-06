const { EmojiDelete } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildEmoji} emoji
 */
 const handler = async (self, emoji) => {
    const server = await self.db.servers.find({ _id: emoji.guild.id })

    if (!server) return false

    await EmojiDelete(self, server, emoji)

    return true
}

module.exports = {
    name: 'emojiDelete',
    handler
}