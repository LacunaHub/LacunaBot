class Greeting {
    /**
     * Отправляет приветственное сообщение
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} member
     */
    static async Handle(self, server, member) {
        if (member.user.bot) return false

        if (server.modules.welcome.active) {
            const message = server.modules.welcome.message

            if (message) {
                if (server.modules.welcome.format == 'DM') {
                    try {
                        await member.send(null, { content: message.content })
                    } catch (err) {
                        
                    }
                }

                if (server.modules.welcome.format == 'CHANNEL') {
                    const channel = member.guild.channels.cache.get(server.modules.welcome.channel_id)

                    if (channel) await channel.send(null, { content: message.content })
                }
            }
        }

        if (server.modules.welcome.initial_roles.active) {
            const roles = member.guild.roles.cache.filter(r => r.editable && server.modules.welcome.initial_roles.roles.includes(r.id))

            if (roles.size) {
                await member.roles.add(roles, '') // Need reason
            }
        }

        if (server.modules.restoring.restore_nicknames || server.modules.restoring.restore_roles) {
            const data = server.modules.restoring.data.find(d => d.user_id == member.id)

            if (data) {
                if (server.modules.restoring.restore_nicknames && data.nickname) {
                    if (member.manageable) await member.setNickname(data.nickname, '') // Need reason
                }

                if (server.modules.restoring.restore_roles && data.roles.length) {
                    const roles = member.guild.roles.cache.filter(r => r.editable && data.roles.includes(r.id))

                    if (roles.size) await member.roles.add(roles, '') // Need reason
                }
            }
        }

        return true
    }
}

module.exports = Greeting