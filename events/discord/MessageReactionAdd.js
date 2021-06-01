const Giveaway = require('../../internals/structures/Giveaway')
const { ReactionMenuAdd, autoReact } = require('../../modules/Reactions')
const Reports = require('../../modules/Reports')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 */
const execute = async (self, reaction, user) => {
    if (self.user.id === user.id) return false

    let partial = false

    if (reaction.partial) {
        reaction = await reaction.fetch()
        partial = true
    }

    const message = reaction.message

    if (message.channel.type == 'dm') return false

    const server = await self.db.servers.fetch({ _id: message.guild.id })

    await ReactionMenuAdd(self, server, reaction, user)
    await Reports.ReactionAdd(self, server, reaction)
    await Giveaway.ReactionAdd(self, server, message, user.id)
    await autoReact(server, message)

    if (partial) {
        await message.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)
        await message.channel.messages.cache.delete(message.id)
    }

    return true
}

module.exports = {
    name: 'messageReactionAdd',
    fn: execute
}