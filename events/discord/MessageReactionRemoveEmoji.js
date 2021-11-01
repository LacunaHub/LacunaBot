/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').MessageReaction} reaction
 */
const handler = async (self, reaction) => {
    let partial = reaction.partial

    reaction = partial ? (await reaction.fetch()) : reaction

    const message = reaction.message.partial ? (await reaction.message.fetch()) : reaction.message

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
    handler
}