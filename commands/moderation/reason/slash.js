const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const case_id = interaction.options?.getInteger('номер-случая')
    const reason = interaction.options?.getString('причина')

    if (!case_id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_id, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!reason) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_reason, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    /**
     * @type {import('discord.js').TextChannel}
     */
    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id)

    if (!case_log) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_log, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const messages = await case_log.messages.fetch({ limit: 50 }, { cache: false })
    const case_message = messages.find(m => m.author.id == self.user.id && m.embeds[0]?.footer?.text?.includes(`#${case_id}`))

    if (!case_message) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_message, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    await self.db.servers.update({ _id: interaction.guild.id, 'moderation.case_log.cases.case_id': case_id }, {
        $set: {
            'moderation.case_log.cases.$.reason': reason
        }
    })

    const embed = new MessageEmbed(case_message.embeds[0])

    embed.fields[1].value = interaction.member.user.tag
    embed.fields[2].value = reason

    await case_message.edit({ embeds: [embed] })

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.reason.texts.case_edited, `**${interaction.member.displayName}**`)}`, ephemeral: true })

    return true
}