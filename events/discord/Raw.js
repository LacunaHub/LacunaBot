/**
 * @param {import('../../internals/Lacuna')} self
 */
const execute = async (self, packet) => {
    if (packet.t === 'INTERACTION_CREATE') {
        const guild = self.guilds.cache.get(packet.d.guild_id)
        const channel = guild.channels.cache.get(packet.d.channel_id)
        const member = await guild.members.fetch(packet.d.member.user.id)

        const interaction = { id: packet.d.id, token: packet.d.token, command: packet.d.data, guild: guild, channel: channel, member: member }

        await self.emit('interactionCreate', interaction)
    }
}

module.exports = {
    name: 'raw',
    fn: execute
}