import Lacuna from '@/internals/Lacuna.js'
import { ChannelType, DMChannel, Events, GuildChannel } from 'discord.js'

const handler = async (self: Lacuna, channel: DMChannel | GuildChannel) => {
    if (channel.type === ChannelType.DM) return false

    const server = await self.db.servers.findOne({ _id: channel.guild.id })
    if (!server || server.blocked) return false

    if (channel.type === ChannelType.GuildVoice) {
        const autoVoice = server.modules.voice_manager.autovoices.find(i => i.channel_id === channel.id)
        const autoVoiceChildren = server.modules.voice_manager.autovoices.find(i =>
            i.children.some(c => c.channel_id === channel.id)
        )
        const tempVoice = autoVoiceChildren ? autoVoiceChildren.children.find(c => c.channel_id === channel.id) : null

        if (autoVoice) {
            await self.db.servers.updateOne(
                { _id: channel.guild.id },
                {
                    $pull: {
                        'modules.voice_manager.autovoices': {
                            channel_id: channel.id
                        }
                    }
                }
            )
        }

        if (tempVoice) {
            await self.db.servers.updateOne(
                { _id: channel.guild.id, 'modules.voice_manager.autovoices.children.channel_id': channel.id },
                {
                    $pull: {
                        'modules.voice_manager.autovoices.$.children': {
                            channel_id: channel.id
                        }
                    }
                }
            )
        }
    }

    return true
}

export default {
    name: Events.ChannelDelete,
    handler
}
