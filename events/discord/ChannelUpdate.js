const ChannelUpdate = require('../../modules/Logs/Channel/ChannelUpdate')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildChannel} before
 * @param {import('discord.js').GuildChannel} channel
 */
const execute = async (self, before, channel) => {
    if (channel.type == 'dm') return false
    if (before.position != channel.position) return false

    const server = await self.db.servers.find({ _id: channel.guild.id })

    if (!server) return false

    await ChannelUpdate(self, server, before, channel)

    return true
}

module.exports = {
    name: 'channelUpdate',
    fn: execute
}