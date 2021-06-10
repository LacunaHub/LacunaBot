const { MessageEmbed } = require('discord.js')
const TemporaryBan = require('../internals/structures/TemporaryBan')
const TemporaryMute = require('../internals/structures/TemporaryMute')
const id = require('../internals/utility/UID')
const { images } = require('./Logs')
const Replacer = require('./Replacer')
const moment = require('moment')

class Warnings {
    /**
     * @param {import('../internals/Lacuna')} self 
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     * @param {Object} options
     * @param {import('discord.js').GuildMember} options.target
     * @param {import('discord.js').GuildMember} options.executor
     * @param {string} options.reason
     */
    static async add(self, server, message, options) {
        const target = options.target, executor = options.executor, reason = options.reason

        const locale = self.translator.locale(server.locale).commands

        const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)
        const case_id = server.moderation.case_log.cases.length + 1
        const timestamp = Date.now()

        const violator = server.moderation.warnings.violators.find(v => v.user_id == target.id)
        const penalty = server.moderation.warnings.penalties.find(p => violator ? p.penalties == violator.violations.length + 1 : 1)
    
        if (!violator) {
            await self.db.servers.update({ _id: message.guild.id }, {
                $push: {
                    'moderation.warnings.violators': {
                        user_id: target.id,
                        violations: [
                            {
                                id: id.simple(5),
                                timestamp: timestamp,
                                reason: reason || ''
                            }
                        ]
                    }
                }
            })
        }
    
        else {
            await self.db.servers.update({ _id: message.guild.id, 'moderation.warnings.violators.user_id': target.id }, {
                $push: {
                    'moderation.warnings.violators.$.violations': {
                        id: id.simple(5),
                        timestamp: timestamp,
                        reason: reason || ''
                    }
                }
            })
        }

        if (penalty) {
            const ban = (penalty.action & 1 << 0) === (1 << 0)
            const mute = (penalty.action & 1 << 1) === (1 << 1)
            const kick = (penalty.action & 1 << 2) === (1 << 2)
            const send_message = (penalty.action & 1 << 3) === (1 << 3)
            const send_dm_message = (penalty.action & 1 << 4) === (1 << 4)
            const reset_violations = (penalty.action & 1 << 7) === (1 << 7)

            if (ban && (!mute && !kick)) {
                if (penalty.duration) {
                    const expires_timestamp = Date.now() + (penalty.duration * 1000)

                    new TemporaryBan(self, {
                        user_id: target.user.id,
                        guild_id: message.guild.id,
                        expires_timestamp: expires_timestamp,
                        reason: `Автомодер: Предупреждение (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                        init: true
                    })
                }

                else {
                    await message.guild.members.ban(target.user.id, { reason: 'Автомодер: Предупреждение' })
                }
            }

            if (mute && (!ban && !kick)) {
                const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
                const tempmute = self.tempmutes.find(tm => tm.user_id == target.user.id)

                if (mute_role && !tempmute && !mute_role.members.has(target.user.id)) {
                    if (penalty.duration) {
                        const expires_timestamp = Date.now() + (penalty.duration * 1000)

                        new TemporaryMute(self, {
                            user_id: target.user.id,
                            guild_id: message.guild.id,
                            role_id: mute_role.id,
                            expires_timestamp: expires_timestamp,
                            reason: `Автомодер: Предупреждение (${moment(expires_timestamp).locale(server.locale).endOf().fromNow(true)})`,
                            init: true
                        })
                    }

                    else {
                        if (server.moderation.roles.on_mute.remove_all_roles) {
                            const current_roles = target.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)
                
                            await self.db.servers.update({ _id: message.guild.id }, {
                                $push: {
                                    'moderation.roles.on_mute.returnable_roles': {
                                        user_id: target.id,
                                        roles: current_roles
                                    }
                                }
                            })
                
                            const strict_roles = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...target.roles.cache.filter(r => !r.editable).map(r => r.id)]
                
                            await target.roles.set([mute_role.id, ...strict_roles], reason).catch(self.logger.error)
                        }
                        
                        else {
                            await target.roles.add(mute_role.id, 'Автомодер: Предупреждение')
                        }
                    }
                }
            }

            if (kick && (!ban && !mute)) {
                if (target.kickable) await target.kick('Автомодер: Предупреждение')
            }

            if (send_message) {
                const content = await Replacer.ReplaceMessageTemplate(self, penalty.message, { message: message, guild: message.guild, member: target })

                await message.channel.send(null, content)

                if (send_dm_message) await target.send(null, content)
            }

            if (reset_violations) {
                await self.db.servers.update({ _id: message.guild.id }, {
                    $pull: {
                        'moderation.warnings.violators': {
                            user_id: target.id
                        }
                    }
                })
            }
        }

        const dm_message = new MessageEmbed()
            .setAuthor(locale.common.case_log.cases.WARN_ADD, images.WARN_ADD)
            .addField(locale.common.case_log.server, message.guild.name, true)
            .addField(locale.common.case_log.reason, reason || locale.common.texts.none, true)
            .setTimestamp()
            .setColor('#EF5350')

        const case_log_message = new MessageEmbed()
            .setAuthor(locale.common.case_log.cases.WARN_ADD, images.WARN_ADD)
            .addField(locale.common.case_log.target, `${target.user.tag}\n(${target.id})`, true)
            .addField(locale.common.case_log.executor, executor.user.tag, true)
            .addField(locale.common.case_log.reason, reason || locale.common.texts.none)
            .setFooter(self.translator.format(locale.common.case_log.case, case_id))
            .setTimestamp()
            .setColor('#EF5350')

        await target.send(dm_message).catch(self.logger.error)

        if (case_log && server.moderation.case_log.case_types.WARN_ADD) {
            await case_log.send(case_log_message).catch(self.logger.error)
        
            await self.db.servers.update({ _id: message.guild.id }, {
                $push: {
                    'moderation.case_log.cases': {
                        case_id: case_id,
                        type: 1 << 8,
                        timestamp: timestamp,
                        reason: reason || '',
                        target: {
                            id: target.id,
                            name: target.user.tag
                        },
                        executor: {
                            id: executor.id,
                            name: executor.user.tag
                        }
                    }
                }
            })
        }
    }
}

module.exports = Warnings