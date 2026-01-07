import { ServerDocument } from '@/database/schemas/Servers'
import { ChannelType, DMChannel, Events, GuildChannel, PermissionsBitField } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, before: DMChannel | GuildChannel, channel: DMChannel | GuildChannel) => {
    if (before.type === ChannelType.DM || channel.type === ChannelType.DM) return false
    if (before.position !== channel.position) return false

    const server: ServerDocument = await self.db.servers.findOne({ _id: channel.guild.id })
    if (!server || server.blocked) return false

    if (channel.type === ChannelType.GuildVoice && !before.permissionOverwrites.cache.equals(channel.permissionOverwrites.cache)) {
        const autoVoice = server.modules.voice_manager.autovoices.find(i => i.children.some(c => c.channel_id === channel.id))
        const child = autoVoice?.children?.find(c => c.channel_id === channel.id)

        if (autoVoice && child && autoVoice?.moderator_roles?.length) {
            const permissions = new PermissionsBitField(BigInt(autoVoice.default.permissions | 0x400))
            const roles: string[] = autoVoice.moderator_roles.filter(mr => channel.guild.roles.cache.some(r => r.editable && r.id === mr))

            for (const role of roles) {
                const overwrites = channel.permissionOverwrites.cache.find(p => p.id === role)

                try {
                    if (!overwrites && channel.manageable) {
                        await channel.permissionOverwrites.create(
                            role,
                            permissions.toArray().reduce((obj, k) => {
                                obj[k] = true
                                return obj
                            }, {}),
                            { reason: 'TempVoices: Set default permissions for moderator roles' }
                        )
                    } else if (!overwrites.allow.has(permissions) && channel.manageable) {
                        await overwrites.edit(
                            permissions.toArray().reduce((obj, k) => {
                                obj[k] = true
                                return obj
                            }, {}),
                            'TempVoices: Set default permissions for moderator roles'
                        )
                    }
                } catch (err) {
                    self.logger.error({
                        module: 'TempVoices',
                        action: 'SetPermissionsForModeratorRoles',
                        err,
                        guildId: channel.guild.id
                    })
                }
            }
        }
    }

    return true
}

export default {
    name: Events.ChannelUpdate,
    handler
}
