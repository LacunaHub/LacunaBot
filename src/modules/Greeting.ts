import { BaseGuildTextChannel, GuildMember } from 'discord.js'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export default async function greet(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.welcome.active) {
        const replacer = new Replacer({ guild: member.guild, member: member }),
            messagePayload = await replacer.replaceTemplateMessage(server.modules.welcome.message)

        try {
            if (server.modules.welcome.format === 'DM') {
                await member.send(messagePayload)
            }

            if (server.modules.welcome.format === 'CHANNEL') {
                const channel = member.guild.channels.cache.get(server.modules.welcome.channel_id) as BaseGuildTextChannel

                if (channel) {
                    await channel.send(messagePayload)
                }
            }
        } catch (err) {
            await self.logger.handleError({ module: 'Greeting', action: 'SendMessage', error: err, guild_id: member.guild.id })
        }

        self.emit('moduleExecution', {
            module: 'Greeting',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }

    if (server.modules.welcome.initial_roles.active) {
        const roles = member.guild.roles.cache.filter(r => r.editable && server.modules.welcome.initial_roles.roles.includes(r.id))

        if (roles.size) {
            try {
                await member.roles.add(roles, 'Greeting: Add initial roles')
            } catch (err) {
                await self.logger.handleError({ module: 'Greeting', action: 'AddInitialRoles', error: err, guild_id: member.guild.id })
            }

            self.emit('moduleExecution', {
                module: 'Greeting',
                category: 'InitialRoles',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })
        }
    }

    if (server.modules.restoring.restore_nicknames || server.modules.restoring.restore_roles) {
        const user = await self.db.users.findOne({ _id: member.id }),
            data =
                user?.restoring_data?.find?.(i => i.guild_id === member.guild.id) ?? server.modules.restoring.data.find(d => d.user_id === member.id)

        if (data) {
            if (server.modules.restoring.restore_nicknames && data.nickname) {
                try {
                    await member.setNickname(data.nickname, 'Restoring: Restore nickname')
                } catch (err) {
                    await self.logger.handleError({ module: 'Restoring', action: 'SetNickname', error: err, guild_id: member.guild.id })
                }
            }

            if (server.modules.restoring.restore_roles && data.roles.length) {
                const strictRoles = server.modules.restoring.strict_roles,
                    restorableRoles = member.guild.roles.cache.filter(r => r.editable && data.roles.includes(r.id) && !strictRoles.includes(r.id))

                if (restorableRoles.size) {
                    try {
                        await member.roles.add(restorableRoles, 'Restoring: Restore roles')
                    } catch (err) {
                        await self.logger.handleError({ module: 'Restoring', action: 'AddRoles', error: err, guild_id: member.guild.id })
                    }
                }
            }

            await self.db.users.updateOne(
                { _id: member.id },
                {
                    $pull: {
                        restoring_data: {
                            guild_id: member.guild.id
                        }
                    }
                }
            )

            const dataInServer = server.modules.restoring.data.some(i => i.user_id === member.id)

            if (dataInServer) {
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
            }

            self.emit('moduleExecution', {
                module: 'Restoring',
                category: 'RestoreData',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })
        }
    }

    return true
}
