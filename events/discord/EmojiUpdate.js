const { EmojiUpdate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildEmoji} before
 * @param {import('discord.js').GuildEmoji} emoji
 */
 const handler = async (self, before, emoji) => {
    const server = await self.db.servers.find({ _id: emoji.guild.id })

    if (!server) return false

    await EmojiUpdate(self, server, before, emoji)

    return true
}

module.exports = {
    name: 'emojiUpdate',
    handler
}