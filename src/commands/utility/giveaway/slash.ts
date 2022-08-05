import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import Giveaway from '../../../internals/structures/Giveaway'
import { truncateString } from '../../../internals/utility/Utils'

export async function createSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    let prize = interaction.options?.getString(t('commands.giveaway.create.options.prize.name'))
    let duration = interaction.options?.getString(t('commands.giveaway.create.options.duration.name')) as any
    let winners = interaction.options?.getInteger(t('commands.giveaway.create.options.winners_amount.name')) ?? 1
    let sponsor = interaction.options?.getString(t('commands.giveaway.create.options.sponsor.name')) ?? interaction.user.tag

    duration = duration && ms(duration) ? ms(duration) : null

    if (!prize) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.create.text_no_prize', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!duration) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.create.text_invalid_duration', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (duration < ms('1m')) duration = ms('1m')
    else if (duration > ms('21d')) duration = ms('21d')

    if (winners && (winners < 1 || winners > 50)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.create.text_invalid_winners_range', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.utility.giveaways.length > 30) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.create.text_max_allowed_giveaways_reached', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    prize = truncateString(prize, 100)

    const ts = Date.now() + duration

    const embed = new MessageEmbed()
        .setTitle(t('commands.giveaway.create.text_giveaway_by', { sponsor: truncateString(sponsor, 64) }))
        .setDescription(t('commands.giveaway.create.text_end_date', { date: `<t:${Math.round(ts / 1000)}:R>` }))
        .addField(t('commands.giveaway.create.text_prize'), prize, true)
        .addField(t('commands.giveaway.create.text_winners_amount'), `${winners}`, true)
        .addField(t('commands.giveaway.create.text_members_amount'), '0', true)
        .setColor(0x43b581)

    const message = await interaction.channel.send({ embeds: [embed] })

    const row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId(`GIVEAWAY-${message.id}`).setStyle('SUCCESS').setLabel(t('commands.giveaway.create.text_participate'))
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
        initial: true
    })

    await interaction.reply({
        content: `${self._emojis.OK} | ${t('commands.giveaway.create.text_giveaway_created', { user: `**${(interaction.member as any).displayName}**` })}`,
        ephemeral: true
    })

    return true
}

export async function removeSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    const message_id = interaction.options?.getString(t('commands.giveaway.remove.options.message_id.name'))

    if (!message_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.remove.text_no_message_id', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const giveaway = self.giveaways.find(g => g.message_id == message_id)

    if (!giveaway) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.remove.text_giveaway_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const ga_message = await giveaway.getMessage()

    if (!ga_message) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.remove.text_ga_message_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await giveaway.end(false)
    await interaction.reply({ content: self._emojis.OK, ephemeral: true })
}

export async function endSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    const message_id = interaction.options?.getString(t('commands.giveaway.end.options.message_id.name'))

    if (!message_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.remove.text_no_message_id', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const giveaway = self.giveaways.find(g => g.message_id == message_id)

    if (!giveaway) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.remove.text_giveaway_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const ga_message = await giveaway.getMessage()

    if (!ga_message) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.giveaway.remove.text_ga_message_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await giveaway.end()
    await interaction.reply({
        content: `${self._emojis.OK} | ${t('commands.giveaway.end.text_giveaway_stopped', { user: `**${(interaction.member as any).displayName}**` })}`,
        ephemeral: true
    })
}

export default { createSlash, removeSlash, endSlash }
