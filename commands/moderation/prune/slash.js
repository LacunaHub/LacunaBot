const { MessageEmbed } = require('discord.js')
const { images } = require('../../../modules/Logs')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const amount = interaction.options?.getInteger('количество')
    const mention = interaction.options?.getMember('пользователь')
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!amount) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.no_amount_argument, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (Math.sign(amount) != 1 || amount < 2 || amount > 100) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.invalid_amount_argument, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (mention) {
        let messages = await interaction.channel.messages.fetch({ limit: amount }, false)
        messages = messages.filter(m => m.author.id == mention.id)

        const deleted = await interaction.channel.bulkDelete(messages, true)
        await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${interaction.member.displayName}**`, deleted.size)}`, ephemeral: true })
    }

    else {
        const deleted = await interaction.channel.bulkDelete(amount, true)
        await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${interaction.member.displayName}**`, deleted.size)}`, ephemeral: true })
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.PRUNE, images.PRUNE_MESSAGES)
        .addField(locale.common.case_log.target, mention ? mention.user.tag : locale.common.texts.none, true)
        .addField(locale.common.case_log.executor, interaction.member.user.tag, true)
        .addField(locale.common.case_log.reason, `${reason} (<#${interaction.channel.id}>)`)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#EF5350')

    if (case_log && server.moderation.case_log.case_types.PRUNE_MESSAGES) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.update({ _id: interaction.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 5,
                    timestamp: Date.now(),
                    reason: reason ? `${amount}:${reason}` : '',
                    target: {
                        id: mention ? mention.id : '',
                        name: mention ? mention.user.tag : ''
                    },
                    executor: {
                        id: interaction.member.id,
                        name: interaction.member.user.tag
                    }
                }
            }
        })
    }

    return true
}