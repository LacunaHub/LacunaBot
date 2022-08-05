import { Message, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export async function balancePrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.economy.active) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.economy_disabled, `**${message.member.displayName}**`)}` })

        return false
    }

    const mention =
        message.mentions.members.first() ||
        (message['args'][0] ? (await message.guild.members.fetch(message['args'][0]).catch(() => {})) ?? message.member : null) ||
        message.member

    const user = await self.db.users.findOne({ _id: mention.id })
    let wallet = user?.activities?.wallets?.find(i => i.guild_id == message.guildId)

    if (!wallet) {
        wallet = {
            guild_id: message.guildId,
            currencies: [],
            transactions: [],
            activity: {
                last_message_at: 0,
                voice_connected_at: 0
            }
        }
    }

    const embed = new MessageEmbed().setAuthor({ name: self.translator.format(locale.wallet.balance.texts.user_balance, mention.displayName), iconURL: mention.displayAvatarURL() })

    if (!wallet.currencies.filter(i => server.modules.economy.currencies.some(ii => i.id == ii.id)).length) embed.setDescription(locale.wallet.balance.texts.empty_wallet)

    for (const c of wallet.currencies) {
        const currency = server.modules.economy.currencies.find(i => i.id == c.id)

        if (currency) embed.addField(currency.name, `${c.amount.toFixed(2)}${currency.symbol}`, true)
    }

    await message.reply({ embeds: [embed] })

    return true
}

export async function transferPrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.economy.active) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.economy_disabled, `**${message.member.displayName}**`)}` })

        return false
    }

    const mention = message.mentions.members.first() || (message['args'][0] ? await message.guild.members.fetch(message['args'][0]).catch(() => {}) : null)
    let amount = isNaN(message['args'][1]) ? null : Number(message['args'][1])
    const currency = message['args'].slice(2).join(' ')

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.wallet.transfer.texts.no_mention, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!amount && typeof amount !== 'number') {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.wallet.transfer.texts.no_amount, `**${message.member.displayName}**`)}` })

        return false
    }

    if (amount < 1) amount = 1

    const user = await self.db.users.findOne({ _id: message.author.id })
    let wallet = user?.activities?.wallets?.find(i => i.guild_id == message.guildId)

    if (!wallet) {
        wallet = {
            guild_id: message.guildId,
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
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.wallet.transfer.texts.insufficient_funds, `**${message.member.displayName}**`)}` })

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

    let mention_wallet = mention_user.activities.wallets.find(i => i.guild_id == message.guildId)

    if (!mention_wallet) {
        mention_wallet = {
            guild_id: message.guildId,
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
        { _id: message.author.id, 'activities.wallets': { $elemMatch: { guild_id: message.guildId, 'currencies.id': currency_id } } },
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
        { arrayFilters: [{ 'guild.guild_id': message.guildId }, { 'currency.id': currency_id }] }
    )

    if (mention_wallet.currencies.some(c => c.id == currency_id)) {
        await self.db.users.updateOne(
            { _id: mention.id, 'activities.wallets': { $elemMatch: { guild_id: message.guildId, 'currencies.id': currency_id } } },
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
                                details: message.author.id,
                                timestamp: Date.now()
                            }
                        ],
                        $position: 0,
                        $slice: 512
                    }
                }
            },
            { arrayFilters: [{ 'guild.guild_id': message.guildId }, { 'currency.id': currency_id }] }
        )
    } else {
        await self.db.users.updateOne(
            { _id: mention.id, 'activities.wallets.guild_id': message.guildId },
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
                                details: message.author.id,
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

    await message.reply({
        content: `${self._emojis.OK} | ${self.translator.format(
            locale.wallet.transfer.texts.transferred,
            `**${message.member.displayName}**`,
            `**${amount}${server.modules.economy.currencies.find(c => c.id == currency_id).symbol}**`,
            `**${mention.displayName}**`
        )}`
    })

    return true
}
