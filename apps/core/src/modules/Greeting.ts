import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { BaseGuildTextChannel, GuildMember } from 'discord.js'
import { DirectMessages } from './DirectMessages.js'
import Replacer from './Replacer.js'

async function sendMessage(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.welcome.active) {
        try {
            const replacer = new Replacer(server.premium.available, { guild: member.guild, member: member }),
                messagePayload = await replacer.replaceTemplateMessage(server.modules.welcome.message)

            if (server.modules.welcome.format === 'CHANNEL') {
                const channel = member.guild.channels.cache.get(
                    server.modules.welcome.channel_id
                ) as BaseGuildTextChannel

                channel && (await channel.send(messagePayload))
            } else if (server.modules.welcome.format === 'DM') {
                DirectMessages.send(self, member, messagePayload)
            }

            self.emit('moduleExecution', {
                guildId: member.guild.id,
                targetId: member.id,
                module: 'Greeting'
            })

            return true
        } catch (err) {
            self.logger.error({ module: 'Greeting', action: 'SendMessage', err, guildId: member.guild.id })
        }
    }

    return false
}

async function addInitialRoles(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.welcome.initial_roles.active) {
        const initialRoles = member.guild.roles.cache.filter(
            v => v.editable && server.modules.welcome.initial_roles.roles.includes(v.id)
        )

        if (initialRoles.size) {
            try {
                await member.roles.add(initialRoles, 'Greeting: Add initial roles')

                self.emit('moduleExecution', {
                    guildId: member.guild.id,
                    targetId: member.id,
                    module: 'Greeting',
                    category: 'InitialRoles'
                })

                return true
            } catch (err) {
                self.logger.error({ module: 'Greeting', action: 'AddInitialRoles', err, guildId: member.guild.id })
            }
        }
    }

    return false
}

async function restoreNicknameAndRoles(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.restoring.restore_nicknames || server.modules.restoring.restore_roles) {
        const user = await self.db.users.findOne({ _id: member.id }).lean(),
            data = user?.restoring_data?.find?.(i => i.guild_id === member.guild.id)

        if (data) {
            if (server.modules.restoring.restore_nicknames && data.nickname) {
                try {
                    await member.setNickname(data.nickname, 'Restoring: Restore nickname')
                } catch (err) {
                    self.logger.error({ module: 'Restoring', action: 'SetNickname', err, guildId: member.guild.id })
                }
            }

            if (server.modules.restoring.restore_roles && data.roles.length) {
                const strictRoles = server.modules.restoring.strict_roles,
                    restorableRoles = member.guild.roles.cache.filter(
                        r => r.editable && data.roles.includes(r.id) && !strictRoles.includes(r.id)
                    )

                if (restorableRoles.size) {
                    try {
                        await member.roles.add(restorableRoles, 'Restoring: Restore roles')
                    } catch (err) {
                        self.logger.error({ module: 'Restoring', action: 'AddRoles', err, guildId: member.guild.id })
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

            self.emit('moduleExecution', {
                guildId: member.guild.id,
                targetId: member.id,
                module: 'Restoring',
                category: 'RestoreData'
            })

            return true
        }
    }

    return false
}

export default {
    sendMessage,
    addInitialRoles,
    restoreNicknameAndRoles
}
