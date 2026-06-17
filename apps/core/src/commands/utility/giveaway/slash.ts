import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import Giveaway from '@/internals/structures/Giveaway.js'
import { truncateString } from '@/internals/utility/Utils.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import ms from 'ms'

export async function createSlash(
    self: Lacuna,
    server: ServerDocument,
    interaction: ChatInputCommandInteraction<'cached'>
) {
    const t = self.i18n.t.bind(null, server.locale)

    let prize = interaction.options?.getString('prize')
    let duration = interaction.options?.getString('duration') as any
    let numberOfWinners = interaction.options?.getInteger('number-of-winners') ?? 1
    let sponsor = interaction.options?.getString('sponsor') ?? interaction.user.tag

    duration = duration && ms(duration) ? ms(duration) : null

    if (!prize) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.InvalidPrize',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    if (!duration) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.InvalidDuration',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    if (duration < ms('1m')) duration = ms('1m')
    else if (duration > ms('21d')) duration = ms('21d')

    if (numberOfWinners && (numberOfWinners < 1 || numberOfWinners > 50)) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.InvalidWinnerCount',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    if (self.giveaways.filter(i => i.guildId === interaction.guildId).size >= 20) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.MaxActiveGiveawaysReached',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    prize = truncateString(prize, 100)
    const expiresAt = Date.now() + duration

    const embed = new EmbedBuilder()
        .setTitle(
            t('Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.GiveawaySponsoredBy', {
                sponsor: truncateString(sponsor, 64)
            })
        )
        .setDescription(
            t('Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.GiveawayWillBeOverIn', {
                relativeTime: `<t:${Math.round(expiresAt / 1000)}:R>`
            })
        )
        .addFields([
            {
                name: t('Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.WinningPrize'),
                value: prize,
                inline: true
            },
            {
                name: t('Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.WinnerCount'),
                value: numberOfWinners.toString(),
                inline: true
            }
        ])
        .setColor(0x43b581)

    const message = await interaction.channel!.send({ embeds: [embed] })
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`GIVEAWAY-${message.id}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎉')
            .setLabel('0')
    )

    await message.edit({ components: [row] })

    new Giveaway(self, {
        message_id: message.id,
        channel_id: message.channel.id,
        guild_id: interaction.guild.id,
        prize: prize,
        expires_at: expiresAt,
        number_of_winners: numberOfWinners,
        participants: [],
        locale: server.locale,
        initial: true
    })

    await interaction.editReply({
        content: `${self.staticEmojis.Check} | ${t(
            'Commands.GiveawayCommand.SubCommands.CreateCommand.Texts.GiveawayHasBeenCreated',
            {
                username: `**${interaction.member.displayName}**`
            }
        )}`
    })

    return true
}

export async function endSlash(
    self: Lacuna,
    server: ServerDocument,
    interaction: ChatInputCommandInteraction<'cached'>
) {
    const t = self.i18n.t.bind(null, server.locale)

    const message_id = interaction.options?.getString('message-id')

    if (!message_id) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.GiveawayCommand.SubCommands.RerollCommand.InvalidMessageId',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    let giveaway = self.giveaways.get(message_id)

    await interaction.deferReply({ ephemeral: true })

    if (!giveaway) {
        const giveawayEntry = server.utility.giveaways.find(i => i.message_id === message_id)

        if (giveawayEntry) {
            giveaway = new Giveaway(self, {
                ...giveawayEntry,
                expires_at: Date.now() + 60000,
                locale: server.locale
            })
        } else {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t(
                    'Commands.GiveawayCommand.SubCommands.RerollCommand.GiveawayNotFound',
                    {
                        username: `**${interaction.member.displayName}**`
                    }
                )}`
            })

            return false
        }
    }

    const giveawayMessage = await giveaway.getMessage()

    if (giveawayMessage && !giveawayMessage.components.length) {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.GiveawayCommand.SubCommands.RerollCommand.GiveawayNotFound',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`
        })

        return false
    }

    await giveaway.delete(false)
    await interaction.deleteReply()

    return true
}

export async function rerollSlash(
    self: Lacuna,
    server: ServerDocument,
    interaction: ChatInputCommandInteraction<'cached'>
) {
    const t = self.i18n.t.bind(null, server.locale)

    const messageId = interaction.options?.getString('message-id')

    if (!messageId) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.GiveawayCommand.SubCommands.RerollCommand.InvalidMessageId',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    const isCached = self.giveaways.has(messageId)
    let giveaway = self.giveaways.get(messageId)

    await interaction.deferReply({ ephemeral: true })

    if (!giveaway) {
        const giveawayEntry = server.utility.giveaways.find(i => i.message_id === messageId)

        if (giveawayEntry) {
            giveaway = new Giveaway(self, {
                ...giveawayEntry,
                locale: server.locale
            })
        } else {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t(
                    'Commands.GiveawayCommand.SubCommands.RerollCommand.GiveawayNotFound',
                    {
                        username: `**${interaction.member.displayName}**`
                    }
                )}`
            })

            return false
        }
    }

    isCached && (await giveaway.delete())
    await interaction.deleteReply()

    return true
}

export default { createSlash, endSlash, rerollSlash }
