const { ChannelDelete } = require('../../modules/Logs')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildChannel} channel
 */
const execute = async (self, channel) => {
    if (channel.type == 'dm') return false

    const server = await self.db.servers.find({ _id: channel.guild.id })

    if (!server) return false

    await ChannelDelete(self, server, channel)

    await self.channels.cache.delete(channel.id)

    return true
}

module.exports = {
    name: 'channelDelete',
    fn: execute
}