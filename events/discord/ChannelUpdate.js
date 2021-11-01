const { Permissions } = require('discord.js')
const ChannelUpdate = require('../../modules/Logs/Channel/ChannelUpdate')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').GuildChannel} before
 * @param {import('discord.js').GuildChannel} channel
 */
const handler = async (self, before, channel) => {
    if (channel.type == 'DM') return false
    if (before.position != channel.position) return false

    const server = await self.db.servers.find({ _id: channel.guild.id })

    if (!server) return false

    if (channel.type == 'GUILD_VOICE' && !before.permissionOverwrites.cache.equals(channel.permissionOverwrites.cache)) {
        const trigger = server.modules.voice_manager.temp_voice_channels.triggers.find(t => t.children.some(c => c.channel_id == channel.id))
        const children = trigger?.children?.find(c => c.channel_id == channel.id)

        if (trigger && children && trigger?.moderator_roles?.length) {
            const permissions = new Permissions(BigInt(trigger.default.permissions | 0x400))
            const roles = trigger.moderator_roles.filter(mr => channel.guild.roles.cache.some(r => r.editable && r.id == mr))

            for (const role of roles) {
                const overwrites = channel.permissionOverwrites.cache.find(p => p.id == role)
                
                if (!overwrites && channel.manageable) await channel.permissionOverwrites.create(role, permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {})).catch(self.logger.error)
                else if (!overwrites.allow.has(permissions) && channel.manageable) await overwrites.edit(permissions.toArray().reduce((obj, k) => { obj[k] = true; return obj }, {})).catch(self.logger.error)
            }
        }
    }

    await ChannelUpdate(self, server, before, channel)

    return true
}

module.exports = {
    name: 'channelUpdate',
    handler
}