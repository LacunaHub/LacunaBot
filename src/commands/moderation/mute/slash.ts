import { BaseGuildTextChannel, CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import ms from 'ms'
import moment from 'moment'
import TemporaryMute from '../../../internals/structures/TemporaryMute'
import { images } from '../../../modules/Logs'
import Replacer from '../../../modules/Replacer'
import Lacuna from '../../../internals/Lacuna'
import { ServerDocument } from '../../../database/schemas/Servers'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    let duration = interaction.options?.getString('длительность') as any
    let reason = interaction.options?.getString('причина') ?? '-'

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!mention.manageable) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.cant_mute_user, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (mention.id == interaction.user.id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const case_id: number = server.moderation.case_log.cases.length + 1

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms(server.moderation.use_timeout_mute ? '28d' : '2y')) duration = ms(server.moderation.use_timeout_mute ? '28d' : '2y')

        reason = `${reason} (${moment(Date.now() + duration).locale(server.locale).fromNow(true)})`
    }

    if (server.moderation.use_timeout_mute) {
        if (!duration) {
            duration = ms('1h')
            reason = `${reason} (${moment(Date.now() + duration).locale(server.locale).fromNow(true)})`
        }

        await mention.disableCommunicationUntil(Date.now() + duration, reason).catch(() => {})
    }

    else {
        let mute_role = interaction.guild.roles.cache.get(server.moderation.roles.mute)

        if (!mute_role || interaction.guild.me.roles.highest.position < mute_role.position) {
            mute_role = await interaction.guild.roles.create({ name: 'Muted', color: 0x607D8B, permissions: interaction.guild.roles.everyone.permissions.remove('SEND_MESSAGES') })
            await self.db.servers.updateOne({ _id: interaction.guild.id }, {
                $set: {
                    'moderation.roles.mute': mute_role.id
                }
            })
        }
    
        const tempmute = self.tempmutes.find(m => m.user_id == mention.id)
    
        if (mention.roles.cache.has(mute_role.id) || tempmute) {
            await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_already_muted, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    
            return false
        }

        if (duration) {
            new TemporaryMute(self, {
                user_id: mention.id,
                guild_id: interaction.guild.id,
                role_id: mute_role.id,
                expires_timestamp: Date.now() + duration,
                reason: reason,
                initial: true
            })
        }
    
        else {
            if (server.moderation.roles.on_mute.remove_all_roles) {
                const current_roles: string[] = mention.roles.cache.filter(r => r.editable && r.id != interaction.guild.id).map(r => r.id)
    
                await self.db.servers.updateOne({ _id: interaction.guild.id }, {
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
    }

    const case_log_message = new MessageEmbed()
        .setAuthor({ name: locale.common.case_log.cases.MUTE_ADD, iconURL: images.MUTE_ADD })
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, interaction.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    if (server.moderation.case_log.case_types_messages.MUTE_ADD.active) {
        const replacer = new Replacer(self, null, { guild: interaction.guild, member: mention, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.case_types_messages.MUTE_ADD.dm_message)

        await mention.send(dm_message).catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.MUTE_ADD) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)

        await self.db.servers.updateOne({ _id: interaction.guild.id }, {
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
                        id: interaction.user.id,
                        name: interaction.user.tag
                    }
                }
            }
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.mute.texts.user_muted, `**${(interaction.member as any).displayName}**`, `**${mention.user.tag}**`)}`, ephemeral: true })

    return true
}