import { Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import Giveaway from '../../../internals/structures/Giveaway'
import { truncateString } from '../../../internals/utility/Utils'

export async function createPrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    let [prize, duration, winners = 1, sponsor = message.author.tag] = message['args']

    duration = duration && ms(duration) ? ms(duration) : null
    winners = isNaN(winners) ? 1 : Number(winners)

    if (!prize) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.no_prize, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!duration) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.invalid_duration, `**${message.member.displayName}**`)}` })

        return false
    }

    if (duration < ms('1m')) duration = ms('1m')
    else if (duration > ms('21d')) duration = ms('21d')

    if (winners && (winners < 1 || winners > 50)) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.invalid_winners_range, `**${message.member.displayName}**`)}`
        })

        return false
    }

    if (server.utility.giveaways.length > 30) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.create.texts.max_allowed_giveaways_reached, `**${message.member.displayName}**`)}`
        })

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

    const _message = await message.channel.send({ embeds: [embed] })

    const row = new MessageActionRow().addComponents(new MessageButton().setCustomId(`GIVEAWAY-${_message.id}`).setStyle('SUCCESS').setLabel('Участвовать'))

    await _message.edit({ components: [row] })

    new Giveaway(self, {
        message_id: _message.id,
        channel_id: message.channel.id,
        guild_id: message.guild.id,
        prize: prize,
        winners_amount: winners,
        expiration_date: new Date(ts),
        locale: server.locale,
        initial: true
    })

    return true
}

export async function removePrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const [message_id] = message['args']

    if (!message_id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.no_message_id, `**${message.member.displayName}**`)}` })

        return false
    }

    const giveaway = self.giveaways.find(g => g.message_id == message_id)

    if (!giveaway) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.giveaway_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    const ga_message = await giveaway.getMessage()

    if (!ga_message) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.ga_message_not_found, `**${message.member.displayName}**`)}`
        })

        return false
    }

    await giveaway.end(false)
    await message.reply({ content: self._emojis.OK })
}

export async function endPrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const [message_id] = message['args']

    if (!message_id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.no_message_id, `**${message.member.displayName}**`)}` })

        return false
    }

    const giveaway = self.giveaways.find(g => g.message_id == message_id)

    if (!giveaway) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.giveaway_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    const ga_message = await giveaway.getMessage()

    if (!ga_message) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.giveaway.remove.texts.ga_message_not_found, `**${message.member.displayName}**`)}`
        })

        return false
    }

    await giveaway.end()
    await message.reply({ content: self._emojis.OK })
}

export default { createPrefix, removePrefix, endPrefix }
