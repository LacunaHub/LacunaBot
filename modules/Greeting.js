const Replacer = require('./Replacer')

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
            const replacer = new Replacer(self, null, { guild: member.guild, member: member })
            const content = await replacer.replaceTemplateMessage(server.modules.welcome.message)

            if (server.modules.welcome.format == 'DM') {
                await member.send(content).catch(self.logger.error)
            }

            if (server.modules.welcome.format == 'CHANNEL') {
                const channel = member.guild.channels.cache.get(server.modules.welcome.channel_id)

                if (channel) await channel.send(content).catch(self.logger.error)
            }

            await self.emit('moduleExecution', { module: 'Greeting', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        }

        if (server.modules.welcome.initial_roles.active) {
            const roles = member.guild.roles.cache.filter(r => r.editable && server.modules.welcome.initial_roles.roles.includes(r.id))

            if (roles.size) {
                await member.roles.add(roles, '') // Need reason

                await self.emit('moduleExecution', { module: 'Greeting: Initial Roles', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
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

                await self.db.servers.update({ _id: member.guild.id }, {
                    $pull: {
                        'modules.restoring.data': {
                            user_id: member.id
                        }
                    }
                })

                await self.emit('moduleExecution', { module: 'Restoring: Member Add', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
            }
        }

        return true
    }
}

module.exports = Greeting