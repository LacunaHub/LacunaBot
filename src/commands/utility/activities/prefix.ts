import { Message, MessageActionRow, MessageButton } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { updateAwards } from '../../../modules/Levels'

export async function setLevelPrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? (await message.guild.members.fetch(message['args'][0]).catch(() => {})) : null)
    const level = Number(message['args'][1])

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-level'].texts.no_mention, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!level || level < 1 || level > 2500) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-level'].texts.no_level, `**${message.member.displayName}**`)}` })

        return false
    }

    let total_xp = 0

    for (let i = 0; i < level; i++) {
        total_xp = total_xp + (150 + (i * i * 8))
    }

    const activity = await self.db.activities.fetch({ _id: message.guild.id })
    const levels = activity.levels.find(level => level.user_id == mention.id)
    
    if (!levels) {
        await self.db.activities.updateOne({ _id: message.guild.id }, {
            $push: {
                levels: {
                    user_id: mention.id,
                    experience: { total: total_xp, current: 0, level: level },
                    activity: {
                        text: { total_messages: 0, last_message_at: null },
                        voice: { total_time: 0, connected_at: null, disconnected_at: null }
                    }
                } as never
            }
        })
    }

    else {
        await self.db.activities.updateOne({ _id: message.guild.id, 'levels.user_id': mention.id }, {
            $set: {
                'levels.$.experience.level': level,
                'levels.$.experience.current': 0,
                'levels.$.experience.total': total_xp
            }
        })
    }

    await updateAwards(self, server, { member: mention, level })

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['set-level'].texts.set_success, `**${message.member.displayName}**`)}` })

    return true
}

export async function setWalletBalancePrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? (await message.guild.members.fetch(message['args'][0]).catch(() => {})) : null)
    let amount = isNaN(message['args'][1]) ? null : Number(message['args'][1])
    const currency = message['args'].slice(2).join(' ')

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-wallet-balance'].texts.no_mention, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!amount && typeof amount !== 'number') {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-wallet-balance'].texts.no_amount, `**${message.member.displayName}**`)}` })

        return false
    }

    const INT32_MAX = Math.pow(2, 31) - 1

    if (amount < -INT32_MAX || amount > INT32_MAX) amount = amount > INT32_MAX ? INT32_MAX : -INT32_MAX

    const activities = await self.db.activities.findOne({ _id: message.guildId })
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

        await self.db.activities.updateOne({ _id: message.guildId }, {
            $push: { wallets: wallet as never }
        })
    }

    const currency_id = server.modules.economy.currencies.find(c => c.name == currency || c.symbol == currency)?.id ?? 'DEFAULT'
    const { symbol: currency_symbol } = server.modules.economy.currencies.find(c => c.id == currency_id)
    
    if (wallet.currencies.some(c => c.id == currency_id)) {
        await self.db.activities.updateOne({ _id: server._id, wallets: { $elemMatch: { user_id: mention.id, 'currencies.id': currency_id } } }, {
            $set: {
                'wallets.$[user].currencies.$[currency].amount': amount
            }
        }, { arrayFilters: [ { 'user.user_id': mention.id }, { 'currency.id': currency_id } ] })
    }

    else {
        await self.db.activities.updateOne({ _id: server._id, 'wallets.user_id': mention.id }, {
            $push: {
                'wallets.$.currencies': {
                    id: currency_id, amount
                }
            }
        })
    }

    const reply = Math.random() <= 0.2 ? locale.activities['set-wallet-balance'].texts.success_2 : locale.activities['set-wallet-balance'].texts.success

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(reply, `**${message.member.displayName}**`, `**${mention.displayName}**`, `**${amount}${currency_symbol}**`)}` })

    return true
}

export async function resetWalletPrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const activities = await self.db.activities.findOne({ _id: message.guildId })

    if (!activities.wallets.length) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['reset-all-wallets'].texts.nothing_to_reset, `**${message.member.displayName}**`)}` })

        return false
    }

    const member = message.mentions.members.first()
    const member_id = message['args'][0]

    if (member_id == 'all') {
        const row = new MessageActionRow()
            .setComponents(
                new MessageButton()
                    .setCustomId('confirm')
                    .setStyle('DANGER')
                    .setLabel(locale.activities['reset-all-wallets'].texts.confirm),
                new MessageButton()
                    .setCustomId('cancel')
                    .setStyle('SECONDARY')
                    .setLabel(locale.activities['reset-all-wallets'].texts.cancel)
            )

        const _message = await message.reply({
            content: `:grey_question: | ${self.translator.format(locale.activities['reset-all-wallets'].texts.confirmation, `**${message.member.displayName}**`)}`,
            components: [row]
        })

        const collector = _message.createMessageComponentCollector({
            componentType: 'BUTTON',
            filter: i => row.components.some(c => c.customId == i.customId) && i.user.id == message.author.id,
            time: 60000,
            max: 1
        })

        collector.on('collect', async i => {
            await i.deferUpdate()

            switch(i.customId) {
                case 'confirm':
                    await self.db.activities.updateOne({ _id: message.guildId }, {
                        $set: {
                            wallets: []
                        }
                    })
                    
                    const reply = Math.random() <= 0.3 ? locale.activities['reset-all-wallets'].texts.confirmed_2 : locale.activities['reset-all-wallets'].texts.confirmed

                    await _message.edit({ content: `${self._emojis.OK} | ${self.translator.format(reply, `**${message.member.displayName}**`)}`, components: [] })
                break

                case 'cancel':
                    await _message.edit({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['reset-all-wallets'].texts.canceled, `**${message.member.displayName}**`)}`, components: [] })
                break
            }
        })
    }

    else {
        await self.db.activities.updateOne({ _id: message.guildId }, {
            $pull: {
                wallets: {
                    user_id: member?.id ?? member_id
                } as never
            }
        })

        await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['reset-wallet'].texts.reset_user, `**${message.member.displayName}**`)}` })
    }

    return true
}

export async function resetLevelPrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const member = message.mentions.members.first()
    const member_id = message['args'][0]

    if (!member && !member_id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['reset-level'].texts.no_mention, `**${message.member.displayName}**`)}` })

        return false
    }

    if (member_id == 'all') {
        await self.db.activities.updateOne({ _id: message.guild.id }, {
            $set: {
                levels: []
            }
        })
    }

    else {
        await self.db.activities.updateOne({ _id: message.guild.id }, {
            $pull: {
                levels: {
                    user_id: member?.id ?? member_id
                } as never
            }
        })
    }

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['reset-level'].texts.reset_success, `**${message.member.displayName}**`)}` })

    return true
}