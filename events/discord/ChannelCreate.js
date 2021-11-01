const ChannelCreate = require('../../modules/Logs/Channel/ChannelCreate')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildChannel} channel
 */
const handler = async (self, channel) => {
    if (channel.type == 'DM') return false

    const server = await self.db.servers.find({ _id: channel.guild.id })

    if (!server) return false

    await ChannelCreate(self, server, channel)

    return true
}

module.exports = {
    name: 'channelCreate',
    handler
}