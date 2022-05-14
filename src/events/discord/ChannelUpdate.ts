import { DMChannel, GuildChannel, Permissions } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { ChannelUpdate } from '../../modules/Logs'

const handler = async (self: Lacuna, before: DMChannel | GuildChannel, channel: DMChannel | GuildChannel) => {
    if (before.type == 'DM' || channel.type == 'DM') return false
    if (before.position != channel.position) return false

    const server: ServerDocument = await self.db.servers.findOne({ _id: channel.guild.id })

    if (!server) return false

    if (channel.type == 'GUILD_VOICE' && !before.permissionOverwrites.cache.equals(channel.permissionOverwrites.cache)) {
        const autovoice = server.modules.voice_manager.autovoices.find(i => i.children.some(c => c.channel_id == channel.id))
        const child = autovoice?.children?.find(c => c.channel_id == channel.id)

        if (autovoice && child && autovoice?.moderator_roles?.length) {
            const permissions = new Permissions(BigInt(autovoice.default.permissions | 0x400))
            const roles: string[] = autovoice.moderator_roles.filter(mr => channel.guild.roles.cache.some(r => r.editable && r.id == mr))

            for (const role of roles) {
                const overwrites = channel.permissionOverwrites.cache.find(p => p.id == role)

                if (!overwrites && channel.manageable)
                    await channel.permissionOverwrites
                        .create(
                            role,
                            permissions.toArray().reduce((obj, k) => {
                                obj[k] = true
                                return obj
                            }, {})
                        )
                        .catch(self.logger.error)
                else if (!overwrites.allow.has(permissions) && channel.manageable)
                    await overwrites
                        .edit(
                            permissions.toArray().reduce((obj, k) => {
                                obj[k] = true
                                return obj
                            }, {})
                        )
                        .catch(self.logger.error)
            }
        }
    }

    await ChannelUpdate(self, server, before, channel)

    return true
}

export default {
    name: 'channelUpdate',
    handler
}
