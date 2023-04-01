import { ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export async function balanceSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.economy.active) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.leaders.text_economy_disabled', {
                user: `**${(interaction.member as any).displayName}**`
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
        name: t('commands.wallet.balance.text_user_balance', { user: mention.displayName }),
        iconURL: mention.displayAvatarURL()
    })

    if (!wallet.currencies.filter(i => server.modules.economy.currencies.some(ii => i.id == ii.id)).length)
        embed.setDescription(t('commands.wallet.balance.text_empty_wallet'))

    for (const c of wallet.currencies) {
        const currency = server.modules.economy.currencies.find(i => i.id == c.id)

        if (currency) embed.addFields([{ name: currency.name, value: `${c.amount.toFixed(2)}${currency.symbol}`, inline: true }])
    }

    await interaction.reply({ embeds: [embed] })

    return true
}

export async function transferSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.economy.active) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.leaders.text_economy_disabled', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const mention = interaction.options?.getMember('user') as GuildMember
    const amount = interaction.options?.getInteger('amount')
    const currency = interaction.options?.getString('currency')

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.wallet.transfer.text_no_mention', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!amount) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.wallet.transfer.text_no_amount', {
                user: `**${(interaction.member as any).displayName}**`
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
            content: `${self._emojis.ERROR} | ${t('commands.wallet.transfer.text_insufficient_funds', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    let mention_user = await self.db.users.findOne({ _id: mention.id })

    if (!mention_user) {
        mention_user = await self.db.users.create({
            _id: mention.id,
            user: {
                username: mention.user.username,
                discriminator: mention.user.discriminator,
                avatar: mention.user.avatar,
                flags: mention.user.flags?.bitfield ?? 0
            }
        } as any)
    }

    let mention_wallet = mention_user.activities.wallets.find(i => i.guild_id == interaction.guildId)

    if (!mention_wallet) {
        mention_wallet = {
            guild_id: interaction.guildId,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }

        await self.db.users.updateOne(
            { _id: mention.id },
            {
                $push: { 'activities.wallets': mention_wallet as never }
            }
        )
    }

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

    if (mention_wallet.currencies.some(c => c.id == currency_id)) {
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
        content: `${self._emojis.OK} | ${t('commands.wallet.transfer.text_transferred', {
            user: `**${(interaction.member as any).displayName}**`,
            amount: `**${amount}${server.modules.economy.currencies.find(c => c.id == currency_id).symbol}**`,
            target: `**${mention.displayName}**`
        })}`,
        ephemeral: true
    })

    return true
}
