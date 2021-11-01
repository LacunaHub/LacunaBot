const ChannelDelete = require('../../modules/Logs/Channel/ChannelDelete')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildChannel} channel
 */
const handler = async (self, channel) => {
    if (channel.type == 'DM') return false

    const server = await self.db.servers.find({ _id: channel.guild.id })

    if (!server) return false

    if (channel.type == 'GUILD_VOICE') {
        const trigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.channel_id == channel.id)
        const trigger_children = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.children.some(c => c.channel_id == channel.id))

        const temp_voice = trigger_children ? trigger_children.children.find(c => c.channel_id == channel.id) : null

        if (trigger) {
            await self.db.servers.update({ _id: channel.guild.id }, {
                $pull: {
                    'modules.voice_manager.temp_voice_channels.triggers': {
                        channel_id: channel.id
                    }
                }
            })
        }

        if (temp_voice) {
            await self.db.servers.update({ _id: channel.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.children.channel_id': channel.id }, {
                $pull: {
                    'modules.voice_manager.temp_voice_channels.triggers.$.children': {
                        channel_id: channel.id
                    }
                }
            })
        }
    }

    await ChannelDelete(self, server, channel)

    setTimeout(() => self.channels.cache.delete(channel.id), 5000)

    return true
}

module.exports = {
    name: 'channelDelete',
    handler
}