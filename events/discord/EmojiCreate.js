const { EmojiCreate } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildEmoji} emoji
 */
 const handler = async (self, emoji) => {
    const server = await self.db.servers.find({ _id: emoji.guild.id })

    if (!server) return false

    await EmojiCreate(self, server, emoji)

    return true
}

module.exports = {
    name: 'emojiCreate',
    handler
}