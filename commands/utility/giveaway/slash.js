const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const ms = require('ms')
const Giveaway = require('../../../internals/structures/Giveaway')
const { truncateString } = require('../../../internals/utility/Utils')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
const createSlash = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    let prize = interaction.options?.getString('приз')
    let duration = interaction.options?.getString('длительность')
    let winners = interaction.options?.getInteger('кол-во-победителей') ?? 1
    let sponsor = interaction.options?.getString('спонсор') ?? interaction.user.tag

    duration = duration && ms(duration) ? ms(duration) : null

    if (!prize) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.no_prize, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!duration) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.invalid_duration, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (ms(duration) < ms('1m')) duration = ms('1m')
    else if (ms(duration) > ms('21d')) duration = ms('21d')

    if (winners && (winners < 1 || winners > 50)) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.invalid_winners_range, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (server.utility.giveaways.length > 30) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.max_allowed_giveaways_reached, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    prize = truncateString(prize, 100)

    const ts = Date.now() + duration

    const embed = new MessageEmbed()
        .setTitle(self.translator.format(locale.giveaway.create.texts.giveaway_by, truncateString(sponsor, 64)))
        .setDescription(self.translator.format(locale.giveaway.create.texts.remains, `<t:${Math.round(ts / 1000)}:R>`))
        .addField(locale.giveaway.create.texts.prize, prize, true)
        .addField(locale.giveaway.create.texts.winners_amount, `${winners}`, true)
        .addField(locale.giveaway.create.texts.members_amount, '0', true)
        .setColor(0x43b581)

    const message = await interaction.channel.send({ embeds: [embed] })

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(`GIVEAWAY-${message.id}`)
                .setStyle('SUCCESS')
                .setLabel('Участвовать')
        )

    await message.edit({ components: [row] })

    new Giveaway(self, {
        message_id: message.id,
        channel_id: message.channel.id,
        guild_id: interaction.guild.id,
        prize: prize,
        winners_amount: winners,
        expiration_date: new Date(ts),
        locale: server.locale,
        init: true
    })

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.giveaway.create.texts.giveaway_created, `**${interaction.member.displayName}**`)}`, ephemeral: true })

    return true
}

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
const removeSlash = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const message_id = interaction.options?.getString('id-сообщения')

    if (!message_id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.no_message_id, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const giveaway = self.giveaways.find(g => g.message_id == message_id)

    if (!giveaway) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.giveaway_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const ga_message = await giveaway.getMessage()

    if (!ga_message) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.ga_message_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    await giveaway.end(false)
    await interaction.reply({ content: self._emojis.OK, ephemeral: true })
}

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
const endSlash = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const message_id = interaction.options?.getString('id-сообщения')

    if (!message_id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.no_message_id, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const giveaway = self.giveaways.find(g => g.message_id == message_id)

    if (!giveaway) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.giveaway_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const ga_message = await giveaway.getMessage()

    if (!ga_message) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.ga_message_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    await giveaway.end()
    await interaction.reply({ content: self._emojis.OK, ephemeral: true })
}

module.exports = { createSlash, removeSlash, endSlash }