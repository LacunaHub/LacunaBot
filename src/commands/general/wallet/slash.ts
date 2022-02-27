import { CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export async function balanceSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.economy.active) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.economy_disabled, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const mention = (interaction.options?.getMember(locale.wallet.balance.options.user.name) ?? interaction.member) as GuildMember

    const activities = await self.db.activities.findOne({ _id: interaction.guild.id })
    let wallet = activities.wallets.find(w => w.user_id == mention.id)

    if (!wallet) {
        wallet = {
            user_id: mention.id,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }
    }

    const embed = new MessageEmbed()
        .setAuthor({ name: self.translator.format(locale.wallet.balance.texts.user_balance, mention.displayName), iconURL: mention.displayAvatarURL() })

    if (!wallet.currencies.filter(i => server.modules.economy.currencies.some(ii => i.id == ii.id)).length) embed.setDescription(locale.wallet.balance.texts.empty_wallet)

    for (const c of wallet.currencies) {
        const currency = server.modules.economy.currencies.find(i => i.id == c.id)

        if (currency) embed.addField(currency.name, `${c.amount.toFixed(2)}${currency.symbol}`, true)
    }

    await interaction.reply({ embeds: [embed] })

    return true
}

export async function transferSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.economy.active) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.economy_disabled, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const mention = interaction.options?.getMember(locale.wallet.transfer.options.user.name) as GuildMember
    const amount = interaction.options?.getInteger(locale.wallet.transfer.options.amount.name)
    const currency = interaction.options?.getString(locale.wallet.transfer.options.currency.name)

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.wallet.transfer.texts.no_mention, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!amount) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.wallet.transfer.texts.no_amount, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const activities = await self.db.activities.findOne({ _id: interaction.guildId })
    let wallet = activities.wallets.find(w => w.user_id == interaction.user.id)

    if (!wallet) {
        wallet = {
            user_id: interaction.user.id,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }
    }

    const currency_id = server.modules.economy.currencies.find(c => c.name == currency || c.symbol == currency)?.id ?? 'DEFAULT'
    const transaction_currency = wallet.currencies.find(c => c.id == currency_id)

    if (!transaction_currency || transaction_currency.amount < amount) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.wallet.transfer.texts.insufficient_funds, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    let mention_wallet = activities.wallets.find(w => w.user_id == mention.id)

    if (!mention_wallet) {
        mention_wallet = {
            user_id: mention.id,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }

        await self.db.activities.updateOne({ _id: interaction.guildId }, {
            $push: { wallets: mention_wallet as never }
        })
    }

    await self.db.activities.updateOne({ _id: interaction.guildId, wallets: { $elemMatch: { user_id: interaction.user.id, 'currencies.id': currency_id } } }, {
        $inc: {
            'wallets.$[user].currencies.$[currency].amount': -amount
        },
        $push: {
            'wallets.$[user].transactions': {
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
    }, { arrayFilters: [ { 'user.user_id': interaction.user.id }, { 'currency.id': currency_id } ] })

    if (mention_wallet.currencies.some(c => c.id == currency_id)) {
        await self.db.activities.updateOne({ _id: interaction.guildId, wallets: { $elemMatch: { user_id: mention.id, 'currencies.id': currency_id } } }, {
            $inc: {
                'wallets.$[user].currencies.$[currency].amount': amount
            },
            $push: {
                'wallets.$[user].transactions': {
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
        }, { arrayFilters: [ { 'user.user_id': mention.id }, { 'currency.id': currency_id } ] })
    }

    else {
        await self.db.activities.updateOne({ _id: interaction.guildId, 'wallets.user_id': mention.id }, {
            $push: {
                'wallets.$.currencies': {
                    id: currency_id, amount
                },
                'wallets.$.transactions': {
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
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.wallet.transfer.texts.transferred, `**${(interaction.member as any).displayName}**`, `**${amount}${server.modules.economy.currencies.find(c => c.id == currency_id).symbol}**`, `**${mention.displayName}**`)}`, ephemeral: true })

    return true
}