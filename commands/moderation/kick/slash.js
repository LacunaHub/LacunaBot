const { MessageEmbed } = require('discord.js')
const { images } = require('../../../modules/Logs')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь')
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.user_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!mention.kickable) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.cant_kick_user, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (mention.id == interaction.member.id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${interaction.member.displayName}**`)}` })

        return false
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    const dm_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.KICK, images.KICK)
        .addField(locale.common.case_log.server, interaction.guild.name, true)
        .addField(locale.common.case_log.reason, reason, true)
        .setTimestamp()
        .setColor('#EF5350')

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.KICK, images.KICK)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, interaction.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    await mention.send({ content: dm_message }).catch(self.logger.error)

    await mention.kick(reason).catch(self.logger.error)

    if (case_log && server.moderation.case_log.case_types.KICK) {
        await case_log.send({ content: case_log_message }).catch(self.logger.error)
    
        await self.db.servers.update({ _id: interaction.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 2,
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

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.kick.texts.user_kicked, `**${interaction.member.displayName}**`, `**${mention.user.tag}**`)}`, ephemeral: true })

    return true
}