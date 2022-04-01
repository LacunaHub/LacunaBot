import { Message, MessageActionRow, MessageButton } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { updateAwards } from '../../../modules/Levels'

export async function setLevelPrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? (await message.guild.members.fetch(message['args'][0]).catch(() => {})) : null)
    const set_level = Number(message['args'][1])

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-level'].texts.no_mention, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!set_level || set_level < 1 || set_level > 2500) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-level'].texts.no_level, `**${message.member.displayName}**`)}` })

        return false
    }

    let total_xp = 0

    for (let i = 0; i < set_level; i++) {
        total_xp = total_xp + (150 + (i * i * 8))
    }

    let user = await self.db.users.findOne({ _id: mention.id })

    if (!user) {
        user = await self.db.users.create({
            _id: mention.id,
            user: {
                username: mention.user.username,
                discriminator: mention.user.discriminator,
                avatar: mention.user.avatar,
                flags: mention.user.flags?.bitfield ?? 0
            }
        } as any)
    }

    const level = user.activities.levels.find(i => i.guild_id == message.guildId)
    
    if (!level) {
        await self.db.users.updateOne({ _id: mention.id }, {
            $push: {
                'activities.levels': {
                    guild_id: message.guildId,
                    experience: { total: total_xp, current: 0, level: set_level },
                    activity: {
                        total_messages: 0,
                        last_message_at: null,
                        total_voice_time: 0,
                        voice_connected_at: null
                    }
                } as never
            }
        })
    }

    else {
        await self.db.users.updateOne({ _id: mention.id, 'activities.levels.guild_id': message.guildId }, {
            $set: {
                'activities.levels.$.experience.level': set_level,
                'activities.levels.$.experience.current': 0,
                'activities.levels.$.experience.total': total_xp
            }
        })
    }

    await updateAwards(self, server, { member: mention, level: set_level })

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

    let user = await self.db.users.findOne({ _id: mention.id })

    if (!user) {
        user = await self.db.users.create({
            _id: mention.id,
            user: {
                username: mention.user.username,
                discriminator: mention.user.discriminator,
                avatar: mention.user.avatar,
                flags: mention.user.flags?.bitfield ?? 0
            }
        } as any)
    }

    let wallet = user.activities.wallets.find(i => i.guild_id == message.guildId)

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

        await self.db.users.updateOne({ _id: mention.id }, {
            $push: { 'activities.wallets': wallet as never }
        })
    }

    const currency_id = server.modules.economy.currencies.find(c => c.name == currency || c.symbol == currency)?.id ?? 'DEFAULT'
    const { symbol: currency_symbol } = server.modules.economy.currencies.find(c => c.id == currency_id)
    
    if (wallet.currencies.some(c => c.id == currency_id)) {
        await self.db.users.updateOne({ _id: mention.id, 'activities.wallets': { $elemMatch: { guild_id: message.guildId, 'currencies.id': currency_id } } }, {
            $set: {
                'activities.wallets.$[guild].currencies.$[currency].amount': amount
            }
        }, { arrayFilters: [ { 'guild.guild_id': message.guildId }, { 'currency.id': currency_id } ] })
    }

    else {
        await self.db.users.updateOne({ _id: mention.id, 'activities.wallets.guild_id': message.guildId }, {
            $push: {
                'activities.wallets.$.currencies': {
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

    const activities = await self.db.users.find({ 'activities.wallets.guild_id': message.guildId })

    if (!activities.length) {
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
                    await self.db.users.updateMany({ 'activities.wallets.guild_id': message.guildId }, {
                        $pull: {
                            'activities.wallets': { guild_id: message.guildId }
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
        await self.db.users.updateOne({ _id: member?.id ?? member_id }, {
            $pull: {
                'activities.wallets': { guild_id: message.guildId }
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
        await self.db.users.updateMany({ 'activities.levels.guild_id': message.guildId }, {
            $pull: {
                'activities.levels': { guild_id: message.guildId }
            }
        })
    }

    else {
        await self.db.users.updateOne({ _id: member?.id ?? member_id }, {
            $pull: {
                'activities.levels': { guild_id: message.guildId }
            }
        })
    }

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['reset-level'].texts.reset_success, `**${message.member.displayName}**`)}` })

    return true
}