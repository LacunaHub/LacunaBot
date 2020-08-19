/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').Message} message
 */
const execute = async (self, message) => {
    const server = await self.db.servers.fetch({ _id: message.guild.id })
    const elements = server.modules.reactions.filter(r => r.message.id == message.id)

    if (elements.length) {
        await self.db.servers.update({ _id: message.guild.id }, {
            $pull: {
                'modules.reactions': {
                    'message.id': message.id
                }
            }
        })
    }

    await message.reactions.cache.clear()

    return true
}

module.exports = {
    name: 'messageReactionRemoveAll',
    fn: execute
}