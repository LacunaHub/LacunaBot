const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { truncateString } = require('../../../internals/utility/Utils')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.reports.active || !server.modules.reports.channel_id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.report.texts.reports_disabled_or_no_channel, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const channel = interaction.guild.channels.cache.get(server.modules.reports.channel_id)

    if (!channel) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.report.texts.channel_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const target_id = interaction.options?.getString('id-сообщения')

    if (!target_id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.report.texts.no_message_id, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const target = await interaction.channel.messages.fetch(target_id).catch(() => {})

    if (!target) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.report.texts.no_message, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const messages = await channel.messages.fetch({ limit: 50 }).catch(() => {})
    const report = messages?.find(m => m.author.id == self.user.id && m.embeds[0]?.footer?.text?.startsWith(`ID: ${target.id}`))

    if (!report) {
        const embed = new MessageEmbed()
            .setAuthor(target.author.tag, target.author.displayAvatarURL())
            .addField('Канал сообщения', `<#${target.channelId}>`, true)
            .addField('Количество репортов', '1', true)
            .setFooter(`ID: ${target.id}`)
            .setTimestamp(target.createdTimestamp)

        if (target.attachments.filter(file => file.width).size > 0) embed.setImage(target.attachments.first().proxyURL)
        if (target.content) embed.setDescription(`${truncateString(target.content, 768)}${target.embeds[0] ? `\n\`[${locale.report.texts.attachments}]\`` : ''}`)

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel(locale.report.texts.jump_to_message)
                    .setStyle('LINK')
                    .setURL(target.url)
            )

        await channel.send({ embeds: [embed], components: [row] }).catch(self.logger.error)
    }

    else {
        const embed = new MessageEmbed(report.embeds[0])
        const count = embed.fields[1].value

        embed.fields[1].value = (Number(count) + 1).toString()

        await report.edit({ embeds: [embed] }).catch(self.logger.error)
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.report.texts.report_confirm, `**${interaction.member.displayName}**`)}`, ephemeral: true })

    return true
}