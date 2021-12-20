import { BaseGuildTextChannel, Message, MessageEmbed } from 'discord.js'
import ms from 'ms'
import moment from 'moment'
import TemporaryMute from '../../../internals/structures/TemporaryMute'
import { images } from '../../../modules/Logs'
import Replacer from '../../../modules/Replacer'
import Lacuna from '../../../internals/Lacuna'
import { ServerDocument } from '../../../database/schemas/Servers'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? (await message.guild.members.fetch(message['args'][0])) : null)
    let duration = message['args'][1]
    
    duration = duration && ms(duration) ? ms(duration) : null

    let reason = message['args'].slice(duration ? 2 : 1).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!mention.manageable) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.cant_mute_user, `**${message.member.displayName}**`)}` })

        return false
    }

    if (mention.id == message.member.id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${message.member.displayName}**`)}` })

        return false
    }

    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const case_id: number = server.moderation.case_log.cases.length + 1

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason} (${moment(Date.now() + duration).locale(server.locale).fromNow(true)})`
    }

    let mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)

    if (!mute_role || message.guild.me.roles.highest.position < mute_role.position) {
        mute_role = await message.guild.roles.create({ name: 'Muted', color: 0x607D8B, permissions: message.guild.roles.everyone.permissions.remove('SEND_MESSAGES') })
        await self.db.servers.updateOne({ _id: message.guild.id }, {
            $set: {
                'moderation.roles.mute': mute_role.id
            }
        })
    }

    const tempmute = self.tempmutes.find(m => m.user_id == mention.id)

    if (mention.roles.cache.has(mute_role.id) || tempmute) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_already_muted, `**${message.member.displayName}**`)}` })

        return false
    }

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.MUTE_ADD, images.MUTE_ADD)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, message.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    if (server.moderation.case_log.case_types_messages.MUTE_ADD.active) {
        const replacer = new Replacer(self, null, { guild: message.guild, member: mention, message, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.case_types_messages.MUTE_ADD.dm_message)

        await mention.send(dm_message).catch(self.logger.error)
    }

    if (duration) {
        new TemporaryMute(self, {
            user_id: mention.id,
            guild_id: message.guild.id,
            role_id: mute_role.id,
            expires_timestamp: Date.now() + duration,
            reason: reason,
            initial: true
        })
    }

    else {
        if (server.moderation.roles.on_mute.remove_all_roles) {
            const current_roles: string[] = mention.roles.cache.filter(r => r.editable && r.id != message.guild.id).map(r => r.id)

            await self.db.servers.updateOne({ _id: message.guild.id }, {
                $push: {
                    'moderation.roles.on_mute.returnable_roles': {
                        user_id: mention.id,
                        roles: current_roles
                    }
                }
            })

            const strict_roles: string[] = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...mention.roles.cache.filter(r => !r.editable).map(r => r.id)]

            await mention.roles.set([mute_role.id, ...strict_roles], reason).catch(self.logger.error)
        }
        
        else {
            await mention.roles.add(mute_role, reason).catch(self.logger.error)
        }

        if (mention.voice?.channelId) await mention.voice.setMute(true, reason).catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.MUTE_ADD) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)

        await self.db.servers.updateOne({ _id: message.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 3,
                    timestamp: Date.now(),
                    reason: reason,
                    target: {
                        id: mention.id,
                        name: mention.user.tag
                    },
                    executor: {
                        id: message.member.id,
                        name: message.member.user.tag
                    }
                }
            }
        })
    }

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.mute.texts.user_muted, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}` })

    return true
}