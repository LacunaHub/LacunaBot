const { ReactionMenuRemove } = require('../../modules/Reactions')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 */
const handler = async (self, reaction, user) => {
    if (self.user.id === user.id) return false
    
    let partial = reaction.partial

    reaction = partial ? (await reaction.fetch()) : reaction

    const message = reaction.message.partial ? (await reaction.message.fetch()) : reaction.message

    if (message.channel.type == 'DM') return false

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    await ReactionMenuRemove(self, server, reaction, user)

    if (partial) {
        await message.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)
        await message.channel.messages.cache.delete(message.id)
    }

    return true
}

module.exports = {
    name: 'messageReactionRemove',
    handler
}