import { Message } from 'discord.js'
import moment from 'moment'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import TemporaryBan from '../../internals/structures/TemporaryBan'
import TemporaryMute from '../../internals/structures/TemporaryMute'
import Replacer from '../Replacer'
import { addWarn } from '../Warnings'

const reason = 'Автомодер: Анти-капс'

export default async function(self: Lacuna, server: ServerDocument, message: Message) {
    const config = server.moderation.automoder.links_filter

    if (!config.active) return false
    if (message.member.permissions.any(BigInt(config.ignored.permissions), false)) return false

    if (config.ignored.channels.includes(message.channel.id)) return false
    if (message.member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    const content: string = message.content.toLowerCase()
    const split: string[] = content.split(/\s{1,}/)
    const links = message.content.match(/(https?:\/\/[^\s]+)/gi)

    if (links && links.length) {
        const delete_referral_invites = config.delete_referral_invites && links.some(link => link.includes('discord.gg'))

        if (config.delete_all_links && !delete_referral_invites && !config.allowed_registry.some(reg => links.some(link => link.includes(reg)))) {
            if (message.deletable && !message.deleted) await message.delete()

            await penalty(self, server, message)

            return true
        }
    }

    if (config.delete_referral_invites && message.guild.me.permissions.has('MANAGE_GUILD')) {
        const guild_invites = await message.guild.invites.fetch()
        const invites = message.content.match(/discord.gg\/\w+/gi)
        const is_referral = invites ? invites.some(i => !guild_invites.some(k => k.url == `https://${i}`)) : false
        
        if (is_referral) {
            if (message.deletable && !message.deleted) await message.delete().catch(self.logger.error)

            await penalty(self, server, message)

            return true
        }
    }

    if (config.registry.some(reg => split.some(s => s.includes(reg)))) {
        await penalty(self, server, message)

        return true
    }

    return false
}

async function penalty(self: Lacuna, server: ServerDocument, message: Message) {
    const config = server.moderation.automoder.links_filter

    const ban = (config.penalty.action & 1 << 0) === (1 << 0)
    const mute = (config.penalty.action & 1 << 1) === (1 << 1)
    const send_message = (config.penalty.action & 1 << 2) === (1 << 2)
    const delete_message = (config.penalty.action & 1 << 3) === (1 << 3)
    const kick = (config.penalty.action & 1 << 4) === (1 << 4)
    const warn = (config.penalty.action & 1 << 5) === (1 << 5)
    const edit_roles = (config.penalty.action & 1 << 6) === (1 << 6)

    if (ban && (!mute && !kick)) {
        if (config.penalty.timer) {
            const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

            new TemporaryBan(self, {
                user_id: message.author.id,
                guild_id: message.guild.id,
                expires_timestamp: expires_timestamp,
                reason: `${reason} (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`,
                initial: true
            })
        }

        else {
            await message.guild.members.ban(message.author.id, { reason: reason }).catch(self.logger.error)
        }
    }

    if (mute && (!ban && !kick)) {
        const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
        const tempmute = self.tempmutes.find(tm => tm.user_id == message.author.id)

        if (mute_role && !tempmute && !mute_role.members.has(message.author.id)) {
            if (config.penalty.timer) {
                const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                new TemporaryMute(self, {
                    user_id: message.author.id,
                    guild_id: message.guild.id,
                    role_id: mute_role.id,
                    expires_timestamp: expires_timestamp,
                    reason: `${reason} (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`,
                    initial: true
                })
            }

            else {
                if (server.moderation.roles.on_mute.remove_all_roles) {
                    const current_roles: string[] = message.member.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)
        
                    await self.db.servers.updateOne({ _id: message.guild.id }, {
                        $push: {
                            'moderation.roles.on_mute.returnable_roles': {
                                user_id: message.author.id,
                                roles: current_roles
                            }
                        }
                    })
        
                    const strict_roles: string[] = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...message.member.roles.cache.filter(r => !r.editable).map(r => r.id)]
        
                    await message.member.roles.set([mute_role.id, ...strict_roles], reason).catch(self.logger.error)
                }

                else {
                    await message.member.roles.add(mute_role.id, reason).catch(self.logger.error)
                }
            }
        }
    }

    if (kick && (!ban && !mute)) {
        if (message.member.kickable) await message.member.kick(reason).catch(self.logger.error)
    }

    if (edit_roles && (!ban && !kick)) {
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
        await addWarn(self, server, message, { target: message.member, executor: message.guild.me, reason: reason })
    }

    if (send_message && (config.penalty.message.content || config.penalty.message.embed.active)) {
        const replacer = new Replacer(self, null, { message: message, guild: message.guild, member: message.member })
        const content = await replacer.replaceTemplateMessage(config.penalty.message)

        await message.channel.send(content).catch(self.logger.error)
    }

    if (!config.penalty.action || delete_message) {
        if (message.deletable && !message.deleted) await message.delete().catch(self.logger.error)

        return true
    }

    self.emit('moduleExecution', { module: 'Automoder: Links Filter', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
}