import { GuildMember } from 'discord.js'
import moment from 'moment'
import ms from 'ms'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import TemporaryBan from '../../internals/structures/TemporaryBan'
import TemporaryMute from '../../internals/structures/TemporaryMute'

const reason = 'Автомодер: Модерирование новоприбывших'

export default async function(self: Lacuna, server: ServerDocument, member: GuildMember) {
    const config = server.moderation.automoder.newbies

    if (!config.active) return false

    const values = {
        MINUTES: 60,
        HOURS: 3600,
        DAYS: 86400
    }

    const is_newbie = (Date.now() - member.user.createdTimestamp) / 1000 < config.minimum_account_age.value * values[config.minimum_account_age.measure]

    if (is_newbie) {
        const ban = (config.penalty.action & 1 << 0) === (1 << 0)
        const mute = (config.penalty.action & 1 << 1) === (1 << 1)
        const kick = (config.penalty.action & 1 << 4) === (1 << 4)
        const edit_roles = (config.penalty.action & 1 << 6) === (1 << 6)

        if (ban && (!mute && !kick)) {
            if (config.penalty.timer) {
                const expires_timestamp = Date.now() + (config.penalty.timer * 1000)

                new TemporaryBan(self, {
                    user_id: member.id,
                    guild_id: member.guild.id,
                    expires_timestamp: expires_timestamp,
                    reason: `${reason} (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`,
                    initial: true
                })
            }

            else {
                await member.guild.members.ban(member.id, { reason: reason }).catch(self.logger.error)
            }
        }

        if (mute && (!ban && !kick)) {
            if (server.moderation.use_timeout_mute) {
                const expires_timestamp: number = Date.now() + (config.penalty.timer ? (config.penalty.timer * 1000) : ms('2h'))

                await member.disableCommunicationUntil(expires_timestamp, reason).catch(() => {})
            }
            
            else {
                const mute_role = member.guild.roles.cache.get(server.moderation.roles.mute)
                const tempmute = self.tempmutes.find(tm => tm.user_id == member.id)
    
                if (mute_role && !tempmute && !mute_role.members.has(member.id)) {
                    if (config.penalty.timer) {
                        const expires_timestamp = Date.now() + (config.penalty.timer * 1000)
    
                        new TemporaryMute(self, {
                            user_id: member.id,
                            guild_id: member.guild.id,
                            role_id: mute_role.id,
                            expires_timestamp: expires_timestamp,
                            reason: `${reason} (${moment(expires_timestamp).locale(server.locale).fromNow(true)})`,
                            initial: true
                        })
                    }
    
                    else {
                        if (server.moderation.roles.on_mute.remove_all_roles) {
                            const current_roles: string[] = member.roles.cache.filter(r => r.editable && r.id != member.guild.id).map(r => r.id)
                
                            await self.db.servers.updateOne({ _id: member.guild.id }, {
                                $push: {
                                    'moderation.roles.on_mute.returnable_roles': {
                                        user_id: member.id,
                                        roles: current_roles
                                    }
                                }
                            })
                
                            const strict_roles: string[] = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...member.roles.cache.filter(r => !r.editable).map(r => r.id)]
                
                            await member.roles.set([mute_role.id, ...strict_roles], reason).catch(self.logger.error)
                        }
    
                        else {
                            await member.roles.add(mute_role.id, reason).catch(self.logger.error)
                        }
                    }
                }
            }
        }

        if (kick && (!ban && !mute)) {
            if (member.kickable) await member.kick(reason).catch(self.logger.error)
        }

        if (edit_roles && (!ban && !kick)) {
            if (config.penalty?.add_roles?.length) {
                const editable = member.guild.roles.cache.filter(r => r.editable && config.penalty.add_roles.includes(r.id))

                if (editable.size) {
                    await member.roles.add(editable, reason).catch(self.logger.error)
                }
            }

            if (config.penalty?.remove_roles?.length) {
                const editable = member.guild.roles.cache.filter(r => r.editable && config.penalty.remove_roles.includes(r.id))

                if (editable.size) {
                    await member.roles.remove(editable, reason).catch(self.logger.error)
                }
            }
        }

        self.emit('moduleExecution', { module: 'Automoder: Newbies Moderation', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
    
        return true
    }
}