const Replacer = require('./Replacer')

class Farewell {
    /**
     * Отправляет прощальное сообщение
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').GuildMember} member
     */
    static async Handle(self, server, member) {
        if (member.user.bot) return false

        if (server.modules.farewell.active) {
            const content = await Replacer.ReplaceMessageTemplate(self, server.modules.farewell.message, { guild: member.guild, member: member })

            if (server.modules.farewell.format == 'DM') {
                await member.send(null, content).catch(self.logger.error)
            }

            if (server.modules.farewell.format == 'CHANNEL') {
                const channel = member.guild.channels.cache.get(server.modules.farewell.channel_id)

                if (channel) await channel.send(null, content).catch(self.logger.error)
            }

            await self.emit('moduleExecution', { module: 'Farewell', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        }

        if (server.modules.restoring.restore_nicknames || server.modules.restoring.restore_roles) {
            if (member.user.bot) return false

            const data = server.modules.restoring.data.find(i => i.user_id == member.id)

            if (!data) {
                await self.db.servers.update({ _id: member.guild.id }, {
                    $push: {
                        'modules.restoring.data': {
                            user_id: member.id,
                            roles: member.roles.cache.filter(r => r.id != member.guild.id).map(r => r.id),
                            nickname: member.nickname,
                            timestamp: Date.now()
                        }
                    }
                })
            }

            else {
                await self.db.servers.update({ _id: member.guild.id, 'modules.restoring.data.user_id': member.id }, {
                    $set: {
                        'modules.restoring.data.$.roles': member.roles.cache.filter(r => r.id != member.guild.id).map(r => r.id),
                        'modules.restoring.data.$.nickname': member.nickname,
                        'modules.restoring.data.$.timestamp': Date.now()
                    }
                })
            }

            await self.emit('moduleExecution', { module: 'Restoring: Member Remove', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        }
    }
}

module.exports = Farewell