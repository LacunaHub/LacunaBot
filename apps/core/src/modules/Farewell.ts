import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { BaseGuildTextChannel, GuildMember } from 'discord.js'
import { DirectMessages } from './DirectMessages.js'
import Replacer from './Replacer.js'

async function sendMessage(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.farewell.active) {
        try {
            const replacer = new Replacer({ guild: member.guild, member: member }),
                messagePayload = await replacer.replaceTemplateMessage(server.modules.farewell.message)

            if (server.modules.farewell.format === 'CHANNEL') {
                const channel = member.guild.channels.cache.get(
                    server.modules.farewell.channel_id
                ) as BaseGuildTextChannel

                channel && (await channel.send(messagePayload))
            } else if (server.modules.farewell.format === 'DM') {
                DirectMessages.send(self, member, messagePayload)
            }

            self.emit('moduleExecution', {
                guildId: member.guild.id,
                targetId: member.id,
                module: 'Farewell'
            })

            return true
        } catch (err) {
            self.logger.error({ module: 'Farewell', action: 'SendMessage', err, guildId: member.guild.id })
        }
    }

    return false
}

async function saveNicknameAndRoles(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.restoring.restore_nicknames || server.modules.restoring.restore_roles) {
        const user = await self.db.users.fetch(
            { _id: member.id },
            {
                user: {
                    username: member.user.username,
                    avatar: member.user.avatar,
                    flags: member.user.flags?.bitfield ?? 0,
                    global_name: member.user.globalName
                }
            }
        )

        const data = user?.restoring_data?.find?.(i => i.guild_id === member.guild.id)

        if (data) {
            await self.db.users.updateOne(
                { _id: member.id, 'restoring_data.guild_id': member.guild.id },
                {
                    $set: {
                        'restoring_data.$.timestamp': Date.now(),
                        'restoring_data.$.roles': member.roles.cache
                            .filter(i => i.id !== member.guild.id)
                            .map(i => i.id),
                        'restoring_data.$.nickname': member.nickname
                    }
                }
            )
        } else {
            await self.db.users.updateOne(
                { _id: member.id },
                {
                    $push: {
                        restoring_data: {
                            guild_id: member.guild.id,
                            timestamp: Date.now(),
                            roles: member.roles.cache.filter(i => i.id !== member.guild.id).map(i => i.id),
                            nickname: member.nickname
                        }
                    }
                }
            )
        }

        self.emit('moduleExecution', {
            guildId: member.guild.id,
            targetId: member.id,
            module: 'Restoring',
            category: 'SaveData'
        })

        return true
    }

    return false
}

export default {
    sendMessage,
    saveNicknameAndRoles
}
