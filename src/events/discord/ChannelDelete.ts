import { DMChannel, GuildChannel } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { ChannelDelete } from '../../modules/Logs'

const handler = async (self: Lacuna, channel: DMChannel | GuildChannel) => {
    if (channel.type == 'DM') return false

    const server: ServerDocument = await self.db.servers.findOne({ _id: channel.guild.id })

    if (!server) return false

    if (channel.type == 'GUILD_VOICE') {
        const autovoice = server.modules.voice_manager.autovoices.find(i => i.channel_id == channel.id)
        const autovoiceChildren = server.modules.voice_manager.autovoices.find(i => i.children.some(c => c.channel_id == channel.id))
        const tempVoice = autovoiceChildren ? autovoiceChildren.children.find(c => c.channel_id == channel.id) : null

        if (autovoice) {
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

    await ChannelDelete(self, server, channel)

    setTimeout(() => self.channels.cache.delete(channel.id), 5000)

    return true
}

export default {
    name: 'channelDelete',
    handler
}
