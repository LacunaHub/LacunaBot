import { DMChannel, GuildChannel } from 'discord.js'
import { ServerDocument, VoiceChannelTrigger, VoiceChannelTriggerChildren } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { ChannelDelete } from '../../modules/Logs'

const handler = async (self: Lacuna, channel: DMChannel | GuildChannel) => {
    if (channel.type == 'DM') return false

    const server: ServerDocument = await self.db.servers.findOne({ _id: channel.guild.id })

    if (!server) return false

    if (channel.type == 'GUILD_VOICE') {
        const trigger: VoiceChannelTrigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.channel_id == channel.id)
        const trigger_children: VoiceChannelTrigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.children.some(c => c.channel_id == channel.id))

        const temp_voice: VoiceChannelTriggerChildren = trigger_children ? trigger_children.children.find(c => c.channel_id == channel.id) : null

        if (trigger) {
            await self.db.servers.updateOne({ _id: channel.guild.id }, {
                $pull: {
                    'modules.voice_manager.temp_voice_channels.triggers': {
                        channel_id: channel.id
                    }
                }
            })
        }

        if (temp_voice) {
            await self.db.servers.updateOne({ _id: channel.guild.id, 'modules.voice_manager.temp_voice_channels.triggers.children.channel_id': channel.id }, {
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

export default {
    name: 'channelDelete',
    handler
}