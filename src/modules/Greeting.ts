import { BaseGuildTextChannel, GuildMember } from 'discord.js'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export default async function greet(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.welcome.active) {
        const replacer = new Replacer(null, { guild: member.guild, member: member })
        const content = await replacer.replaceTemplateMessage(server.modules.welcome.message)

        if (server.modules.welcome.format == 'DM') {
            await member.send(content).catch(self.logger.error)
        }

        if (server.modules.welcome.format == 'CHANNEL') {
            const channel = member.guild.channels.cache.get(server.modules.welcome.channel_id) as BaseGuildTextChannel

            if (channel) await channel.send(content).catch(self.logger.error)
        }

        self.emit('moduleExecution', { module: 'Greeting', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
    }

    if (server.modules.welcome.initial_roles.active) {
        const roles = member.guild.roles.cache.filter(r => r.editable && server.modules.welcome.initial_roles.roles.includes(r.id))

        if (roles.size) {
            await member.roles.add(roles) // Need reason

            self.emit('moduleExecution', {
                module: 'Greeting: Initial Roles',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })
        }
    }

    if (server.modules.restoring.restore_nicknames || server.modules.restoring.restore_roles) {
        const data = server.modules.restoring.data.find(d => d.user_id == member.id)

        if (data) {
            if (server.modules.restoring.restore_nicknames && data.nickname) {
                if (member.manageable) await member.setNickname(data.nickname) // Need reason
            }

            if (server.modules.restoring.restore_roles && data.roles.length) {
                const strict_roles = server.modules.restoring.strict_roles
                const roles = member.guild.roles.cache.filter(r => r.editable && data.roles.includes(r.id) && !strict_roles.includes(r.id))

                if (roles.size) await member.roles.add(roles) // Need reason
            }

            await self.db.servers.updateOne(
                { _id: member.guild.id },
                {
                    $pull: {
                        'modules.restoring.data': {
                            user_id: member.id
                        }
                    }
                }
            )

            self.emit('moduleExecution', {
                module: 'Restoring: Member Add',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })
        }
    }

    return true
}
