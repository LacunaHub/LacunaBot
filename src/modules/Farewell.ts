import { BaseGuildTextChannel, GuildMember } from 'discord.js'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export default async function farewell(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (member.user.bot) return false

    if (server.modules.farewell.active) {
        const replacer = new Replacer({ guild: member.guild, member: member }),
            messagePayload = await replacer.replaceTemplateMessage(server.modules.farewell.message)

        try {
            if (server.modules.farewell.format === 'DM') {
                await member.send(messagePayload)
            }

            if (server.modules.farewell.format === 'CHANNEL') {
                const channel = member.guild.channels.cache.get(server.modules.farewell.channel_id) as BaseGuildTextChannel

                if (channel) {
                    await channel.send(messagePayload)
                }
            }
        } catch (err) {
            await self.logger.handleError({ module: 'Farewell', action: 'SendMessage', error: err, guild_id: member.guild.id })
        }

        self.emit('moduleExecution', {
            module: 'Farewell',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }

    if (server.modules.restoring.restore_nicknames || server.modules.restoring.restore_roles) {
        let user = await self.db.users.findOne({ _id: member.id })

        if (!user) {
            user = await self.db.users.create({
                _id: member.id,
                user: {
                    username: member.user.username,
                    discriminator: member.user.discriminator,
                    avatar: member.user.avatar,
                    flags: member.user.flags
                }
            })
        }

        const data = user?.restoring_data?.find?.(i => i.guild_id === member.guild.id)

        if (data) {
            await self.db.users.updateOne(
                { _id: member.id, 'restoring_data.guild_id': member.guild.id },
                {
                    $set: {
                        'restoring_data.$.timestamp': Date.now(),
                        'restoring_data.$.roles': member.roles.cache.filter(i => i.id !== member.guild.id).map(i => i.id),
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
            module: 'Restoring',
            category: 'SaveData',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }
}
