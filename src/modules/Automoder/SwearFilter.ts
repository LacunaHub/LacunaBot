import { Message } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import TemporaryBan from '../../internals/structures/TemporaryBan'
import TemporaryMute from '../../internals/structures/TemporaryMute'
import { warnings } from '../Moderation'
import Replacer from '../Replacer'

const reason = 'Автомодер: Фильтр слов'

export default async function (self: Lacuna, server: ServerDocument, message: Message) {
    const config = server.moderation.automoder.swear_filter

    if (!config.active) return false
    if (message.member.permissions.any(BigInt(config.ignored.permissions), false)) return false

    if (config.ignored.channels.includes(message.channel.id)) return false
    if (message.member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    const content: string = message.content.toLowerCase()
    const split: string[] = content.split(/\s{1,}/)

    if (config.registry.some(reg => split.includes(reg.toLowerCase()))) {
        const ban = (config.penalty.action & (1 << 0)) === 1 << 0
        const mute = (config.penalty.action & (1 << 1)) === 1 << 1
        const send_message = (config.penalty.action & (1 << 2)) === 1 << 2
        const delete_message = (config.penalty.action & (1 << 3)) === 1 << 3
        const kick = (config.penalty.action & (1 << 4)) === 1 << 4
        const warn = (config.penalty.action & (1 << 5)) === 1 << 5
        const edit_roles = (config.penalty.action & (1 << 6)) === 1 << 6

        if (ban && !mute && !kick) {
            if (config.penalty.timer) {
                const expires_timestamp = Date.now() + config.penalty.timer * 1000

                new TemporaryBan(self, {
                    user_id: message.author.id,
                    guild_id: message.guild.id,
                    expires_timestamp: expires_timestamp,
                    reason: `${reason} (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`,
                    initial: true
                })
            } else {
                await message.guild.members.ban(message.author.id, { reason: reason }).catch(self.logger.error)
            }
        }

        if (mute && !ban && !kick) {
            if (server.moderation.use_timeout_mute) {
                const expires_timestamp: number = Date.now() + (config.penalty.timer ? config.penalty.timer * 1000 : ms('2h'))

                await message.member.disableCommunicationUntil(expires_timestamp, reason).catch(() => {})
            } else {
                const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
                const tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

                if (mute_role && !tempmute && !mute_role.members.has(message.author.id)) {
                    if (config.penalty.timer) {
                        const expires_timestamp = Date.now() + config.penalty.timer * 1000

                        new TemporaryMute(self, {
                            user_id: message.author.id,
                            guild_id: message.guild.id,
                            role_id: mute_role.id,
                            expires_timestamp: expires_timestamp,
                            reason: `${reason} (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`,
                            initial: true
                        })
                    } else {
                        if (server.moderation.roles.on_mute.remove_all_roles) {
                            const current_roles: string[] = message.member.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)

                            await self.db.servers.updateOne(
                                { _id: message.guild.id },
                                {
                                    $push: {
                                        'moderation.roles.on_mute.returnable_roles': {
                                            user_id: message.author.id,
                                            roles: current_roles
                                        }
                                    }
                                }
                            )

                            const strict_roles: string[] = [
                                ...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)),
                                ...message.member.roles.cache.filter(r => !r.editable).map(r => r.id)
                            ]

                            await message.member.roles.set([mute_role.id, ...strict_roles], reason).catch(self.logger.error)
                        } else {
                            await message.member.roles.add(mute_role.id, reason).catch(self.logger.error)
                        }
                    }
                }
            }
        }

        if (kick && !ban && !mute) {
            if (message.member.kickable) await message.member.kick(reason).catch(self.logger.error)
        }

        if (edit_roles && !ban && !kick) {
            if (config.penalty?.add_roles?.length) {
                const editable = message.guild.roles.cache.filter(r => r.editable && config.penalty.add_roles.includes(r.id))

                if (editable.size) {
                    await message.member.roles.add(editable, reason).catch(self.logger.error)
                }
            }

            if (config.penalty?.remove_roles?.length) {
                const editable = message.guild.roles.cache.filter(r => r.editable && config.penalty.remove_roles.includes(r.id))

                if (editable.size) {
                    await message.member.roles.remove(editable, reason).catch(self.logger.error)
                }
            }
        }

        if (warn) {
            await warnings.addWarn(self, server, message, { target: message.member, executor: message.guild.me, reason: reason })
        }

        if (send_message && (config.penalty.message.content || config.penalty.message.embed.active)) {
            const replacer = new Replacer(null, { message: message, guild: message.guild, member: message.member })
            const content = await replacer.replaceTemplateMessage(config.penalty.message)

            await message.channel.send(content).catch(self.logger.error)
        }

        if (!config.penalty.action || delete_message) {
            if (message.deletable) await message.delete().catch(self.logger.error)
        }

        self.emit('moduleExecution', {
            module: 'Automoder: Swear Filter',
            guild: { id: message.guild.id, name: message.guild.name },
            target: { id: message.author.id, name: message.author.tag }
        })

        return true
    }
}
