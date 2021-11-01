const { MessageEmbed } = require('discord.js')
const ms = require('ms')
const moment = require('moment')
const { images } = require('../../../modules/Logs')
const TemporaryBan = require('../../../internals/structures/TemporaryBan')

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
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!mention.bannable) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.cant_ban_user, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    if (duration) {
        if (duration < ms('1m')) duration = ms('1m')
        else if (duration > ms('2y')) duration = ms('2y')

        reason = `${reason} (${moment(Date.now() + duration).locale(server.locale).endOf().fromNow(true)})`
    }

    const dm_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.BAN_ADD, images.BAN_ADD)
        .addField(locale.common.case_log.server, interaction.guild.name, true)
        .addField(locale.common.case_log.reason, reason, true)
        .setTimestamp()
        .setColor('#EF5350')

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.BAN_ADD, images.BAN_ADD)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, interaction.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    await mention.send({ embeds: [dm_message] }).catch(self.logger.error)

    if (duration) {
        new TemporaryBan(self, {
            user_id: mention.id,
            guild_id: interaction.guild.id,
            expires_timestamp: Date.now() + duration,
            reason: reason,
            init: true
        })
    }

    else {
        await interaction.guild.members.ban(mention, { reason: reason }).catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.BAN_ADD) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.update({ _id: interaction.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 0,
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

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.ban.texts.user_banned, `**${interaction.member.displayName}**`, `**${mention.user.tag}**`)}`, ephemeral: true })

    return true
}