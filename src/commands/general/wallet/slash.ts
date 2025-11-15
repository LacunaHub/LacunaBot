import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'

export async function balanceSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.economy.active) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.LeadersCommand.Texts.EconomyIsDisabled', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const mention = (interaction.options?.getMember('user') ?? interaction.member) as GuildMember
    const user = await self.db.users.findOne({ _id: mention.id })
    let wallet = user?.activities?.wallets?.find(i => i.guild_id == interaction.guildId)

    if (!wallet) {
        wallet = {
            guild_id: interaction.guildId,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }
    }

    const embed = new EmbedBuilder().setAuthor({
        name: t('Commands.WalletCommand.SubCommands.BalanceCommand.Texts.WalletBalanceOfUser', { username: mention.displayName }),
        iconURL: mention.displayAvatarURL()
    })

    if (!wallet.currencies.filter(i => server.modules.economy.currencies.some(ii => i.id == ii.id)).length)
        embed.setDescription(t('Commands.WalletCommand.SubCommands.BalanceCommand.Texts.WalletIsEmpty'))

    for (const c of wallet.currencies) {
        const currency = server.modules.economy.currencies.find(i => i.id === c.id)

        if (currency) embed.addFields([{ name: currency.name, value: `${c.amount.toFixed(2)}${currency.symbol}`, inline: true }])
    }

    await interaction.reply({ embeds: [embed] })

    return true
}

export async function transferSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.economy.active) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.LeaderCommand.Texts.EconomyIsDisabled', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const isNotAllowedRole =
            server.modules.economy.transfer.allowed_roles.length &&
            !interaction.member.roles.cache.some(i => server.modules.economy.transfer.allowed_roles.includes(i.id)),
        isBlockedRole = interaction.member.roles.cache.some(i => server.modules.economy.transfer.blocked_roles.includes(i.id))

    if (isNotAllowedRole || isBlockedRole) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.CommandExecutionDenied', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const mention = interaction.options?.getMember('user') as GuildMember
    const amount = interaction.options?.getInteger('amount')
    const currency = interaction.options?.getString('currency')

    if (!mention || mention.user.bot) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.WalletCommand.SubCommands.TransferCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!amount) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.WalletCommand.SubCommands.TransferCommand.Texts.InvalidAmount', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const user = await self.db.users.findOne({ _id: interaction.user.id })
    let wallet = user?.activities?.wallets?.find(i => i.guild_id == interaction.guildId)

    if (!wallet) {
        wallet = {
            guild_id: interaction.guildId,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }
    }

    const currency_id = server.modules.economy.currencies.find(i => i.id === currency)?.id ?? 'DEFAULT'
    const transaction_currency = wallet.currencies.find(i => i.id === currency_id)

    if (!transaction_currency || transaction_currency.amount < amount) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.WalletCommand.SubCommands.TransferCommand.Texts.NoSuchAmountOfFunds', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const mentionUser = await self.db.users.fetch(
        { _id: mention.id },
        {
            user: {
                username: mention.user.username,
                avatar: mention.user.avatar,
                flags: mention.user.flags?.bitfield ?? 0,
                global_name: mention.user.globalName
            }
        }
    )
    const mentionWallet = await self.db.users.fetchWallet(mentionUser, interaction.guildId)

    await self.db.users.updateOne(
        { _id: interaction.user.id, 'activities.wallets': { $elemMatch: { guild_id: interaction.guildId, 'currencies.id': currency_id } } },
        {
            $inc: {
                'activities.wallets.$[guild].currencies.$[currency].amount': -amount
            },
            $push: {
                'activities.wallets.$[guild].transactions': {
                    $each: [
                        {
                            type: 'TRANSFER_TO',
                            amount: amount,
                            details: mention.id,
                            timestamp: Date.now()
                        }
                    ],
                    $position: 0,
                    $slice: 512
                }
            }
        },
        { arrayFilters: [{ 'guild.guild_id': interaction.guildId }, { 'currency.id': currency_id }] }
    )

    if (mentionWallet.currencies.some(c => c.id === currency_id)) {
        await self.db.users.updateOne(
            { _id: mention.id, 'activities.wallets': { $elemMatch: { guild_id: interaction.guildId, 'currencies.id': currency_id } } },
            {
                $inc: {
                    'activities.wallets.$[guild].currencies.$[currency].amount': amount
                },
                $push: {
                    'activities.wallets.$[guild].transactions': {
                        $each: [
                            {
                                type: 'TRANSFER_FROM',
                                amount: amount,
                                details: interaction.user.id,
                                timestamp: Date.now()
                            }
                        ],
                        $position: 0,
                        $slice: 512
                    }
                }
            },
            { arrayFilters: [{ 'guild.guild_id': interaction.guildId }, { 'currency.id': currency_id }] }
        )
    } else {
        await self.db.users.updateOne(
            { _id: mention.id, 'activities.wallets.guild_id': interaction.guildId },
            {
                $push: {
                    'activities.wallets.$.currencies': {
                        id: currency_id,
                        amount
                    },
                    'activities.wallets.$.transactions': {
                        $each: [
                            {
                                type: 'TRANSFER_FROM',
                                amount: amount,
                                details: interaction.user.id,
                                timestamp: Date.now()
                            }
                        ],
                        $position: 0,
                        $slice: 512
                    }
                }
            }
        )
    }

    await interaction.reply({
        content: `${self.staticEmojis.Check} | ${t('Commands.WalletCommand.SubCommands.TransferCommand.Texts.SuccessfulFundsTransfer', {
            username: `**${interaction.member.displayName}**`,
            amount: `**${amount}${server.modules.economy.currencies.find(c => c.id == currency_id).symbol}**`,
            target: `**${mention.displayName}**`
        })}`,
        ephemeral: true
    })

    return true
}
