/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').MessageReaction} reaction
 */
const execute = async (self, reaction) => {
    let partial = false

    if (reaction.partial) {
        reaction = await reaction.fetch()
        partial = true
    }

    const message = reaction.message

    const server = await self.db.servers.fetch({ _id: message.guild.id })
    const element = server.modules.reactions.find(r => r.message.id == message.id && (r.emoji.id ? r.emoji.id == reaction.emoji.id : r.emoji.name == reaction.emoji.name))

    if (element) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                'modules.reactions': {
                    'id': element.id
                }
            }
        })
    }

    await message.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)

    return true
}

module.exports = {
    name: 'messageReactionRemoveEmoji',
    fn: execute
}