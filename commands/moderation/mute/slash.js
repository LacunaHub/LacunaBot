const { MessageEmbed } = require('discord.js')
const ms = require('ms')
const moment = require('moment')
const TemporaryMute = require('../../../internals/structures/TemporaryMute')
const { images } = require('../../../modules/Logs')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь')
    let duration = interaction.options?.getString('длительность')
    let reason = interaction.options?.getString('причина') ?? '-'

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!mention.manageable) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.cant_mute_user, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason} (${moment(Date.now() + duration).locale(server.locale).endOf().fromNow(true)})`
    }

    let mute_role = interaction.guild.roles.cache.get(server.moderation.roles.mute)

    if (!mute_role || interaction.guild.me.roles.highest.position < mute_role.position) {
        mute_role = await interaction.guild.roles.create({ name: 'Muted', color: 0x607D8B, permissions: interaction.guild.roles.everyone.permissions.remove('SEND_MESSAGES') })
        await self.db.servers.update({ _id: interaction.guild.id }, {
            $set: {
                'moderation.roles.mute': mute_role.id
            }
        })
    }

    const tempmute = self.tempmutes.find(m => m.user_id == mention.id)

    if (mention.roles.cache.has(mute_role) || tempmute) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.mute.texts.user_already_muted, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const dm_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.MUTE_ADD, images.MUTE_ADD)
        .addField(locale.common.case_log.server, interaction.guild.name, true)
        .addField(locale.common.case_log.reason, reason, true)
        .setTimestamp()
        .setColor('#EF5350')

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.MUTE_ADD, images.MUTE_ADD)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, interaction.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    await mention.send({ embeds: [dm_message] }).catch(self.logger.error)

    if (duration) {
        new TemporaryMute(self, {
            user_id: mention.id,
            guild_id: interaction.guild.id,
            role_id: mute_role.id,
            expires_timestamp: Date.now() + duration,
            reason: reason,
            init: true
        })
    }

    else {
        if (server.moderation.roles.on_mute.remove_all_roles) {
            const current_roles = mention.roles.cache.filter(r => r.editable && r.id != interaction.guild.id).map(r => r.id)

            await self.db.servers.update({ _id: interaction.guild.id }, {
                $push: {
                    'moderation.roles.on_mute.returnable_roles': {
                        user_id: mention.id,
                        roles: current_roles
                    }
                }
            })

            const strict_roles = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...mention.roles.cache.filter(r => !r.editable).map(r => r.id)]

            await mention.roles.set([mute_role.id, ...strict_roles], reason).catch(self.logger.error)
        }
        
        else {
            await mention.roles.add(mute_role, reason).catch(self.logger.error)
        }

        if (mention.voice.channelId) mention.voice.disconnect(reason).catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.MUTE_ADD) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)

        await self.db.servers.update({ _id: interaction.guild.id }, {
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
                        id: interaction.member.id,
                        name: interaction.member.user.tag
                    }
                }
            }
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.mute.texts.user_muted, `**${interaction.member.displayName}**`, `**${mention.user.tag}**`)}`, ephemeral: true })

    return true
}