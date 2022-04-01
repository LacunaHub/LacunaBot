import { BaseGuildTextChannel, GuildMember } from 'discord.js'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export default async function farewell(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.farewell.active) {
        const replacer = new Replacer(null, { guild: member.guild, member: member })
        const content = await replacer.replaceTemplateMessage(server.modules.farewell.message)

        if (server.modules.farewell.format == 'DM') {
            await member.send(content).catch(self.logger.error)
        }

        if (server.modules.farewell.format == 'CHANNEL') {
            const channel = member.guild.channels.cache.get(server.modules.farewell.channel_id) as BaseGuildTextChannel

            if (channel) await channel.send(content).catch(self.logger.error)
        }

        self.emit('moduleExecution', { module: 'Farewell', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
    }

    if (server.modules.restoring.restore_nicknames || server.modules.restoring.restore_roles) {
        const data = server.modules.restoring.data.find(i => i.user_id == member.id)

        if (!data) {
            await self.db.servers.updateOne({ _id: member.guild.id }, {
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
            await self.db.servers.updateOne({ _id: member.guild.id, 'modules.restoring.data.user_id': member.id }, {
                $set: {
                    'modules.restoring.data.$.roles': member.roles.cache.filter(r => r.id != member.guild.id).map(r => r.id),
                    'modules.restoring.data.$.nickname': member.nickname,
                    'modules.restoring.data.$.timestamp': Date.now()
                }
            })
        }

        self.emit('moduleExecution', { module: 'Restoring: Member Remove', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
    }

    if (server.modules.restoring.data.length) {
        const outdated = server.modules.restoring.data.filter(i => (Date.now() - i.timestamp) > 4838400000)

        if (outdated.length) {
            await self.db.servers.updateOne({ _id: member.guild.id }, {
                $pull: {
                    'modules.restoring.data': {
                        user_id: { $in: outdated.map(i => i.user_id) }
                    }
                }
            })
        }
    }
}