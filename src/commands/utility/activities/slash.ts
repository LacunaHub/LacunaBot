import { CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import Levels from '../../../modules/Levels'

export async function setLevelSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember(locale.activities['set-level'].options.user.name) as GuildMember
    const level = interaction.options?.getInteger(locale.activities['set-level'].options.level.name)

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-level'].texts.no_mention, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!level || level < 1 || level > 2500) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-level'].texts.no_level, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    let total_xp = 0

    for (let i = 0; i < level; i++) {
        total_xp = total_xp + (150 + (i * i * 8))
    }

    const activity = await self.db.activities.fetch({ _id: interaction.guild.id })
    const levels = activity.levels.find(level => level.user_id == mention.id)
    
    if (!levels) {
        await self.db.activities.updateOne({ _id: interaction.guild.id }, {
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
        await self.db.activities.updateOne({ _id: interaction.guild.id, 'levels.user_id': mention.id }, {
            $set: {
                'levels.$.experience.level': level,
                'levels.$.experience.current': 0,
                'levels.$.experience.total': total_xp
            }
        })
    }

    await Levels.updateAwards(self, server, { member: mention, level })

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['set-level'].texts.set_success, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

    return true
}

export async function setWalletBalanceSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember(locale.activities['set-wallet-balance'].options.user.name) as GuildMember
    let amount = interaction.options?.getInteger(locale.activities['set-wallet-balance'].options.amount.name)
    const currency = interaction.options?.getString(locale.activities['set-wallet-balance'].options.currency.name)

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-wallet-balance'].texts.no_mention, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!amount) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-wallet-balance'].texts.no_amount, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const INT32_MAX = Math.pow(2, 31) - 1

    if (amount < -INT32_MAX || amount > INT32_MAX) amount = amount > INT32_MAX ? INT32_MAX : -INT32_MAX

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

        await self.db.activities.updateOne({ _id: interaction.guild.id }, {
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

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(reply, `**${(interaction.member as any).displayName}**`, `**${mention.displayName}**`, `**${amount}${currency_symbol}**`)}` })

    return true
}

export async function resetWalletSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const activities = await self.db.activities.findOne({ _id: interaction.guildId })

    if (!activities.wallets.length) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['reset-wallet'].texts.nothing_to_reset, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const member = interaction.options?.getMember(locale.activities['reset-level'].options.user.name) as GuildMember
    const member_id = interaction.options?.getString(locale.activities['reset-level'].options.user_id.name)

    if (member_id == 'all') {
        const row = new MessageActionRow()
            .setComponents(
                new MessageButton()
                    .setCustomId('confirm')
                    .setStyle('DANGER')
                    .setLabel(locale.activities['reset-wallet'].texts.confirm),
                new MessageButton()
                    .setCustomId('cancel')
                    .setStyle('SECONDARY')
                    .setLabel(locale.activities['reset-wallet'].texts.cancel)
            )

        await interaction.deferReply({ ephemeral: true })

        const message = await interaction.editReply({
            content: `:grey_question: | ${self.translator.format(locale.activities['reset-wallet'].texts.confirmation, `**${(interaction.member as any).displayName}**`)}`,
            components: [row]
        }) as Message

        const collector = message.createMessageComponentCollector({
            componentType: 'BUTTON',
            filter: i => row.components.some(c => c.customId == i.customId),
            time: 60000,
            max: 1
        })

        collector.on('collect', async i => {
            await i.deferUpdate()

            switch(i.customId) {
                case 'confirm':
                    await self.db.activities.updateOne({ _id: interaction.guildId }, {
                        $set: {
                            wallets: []
                        }
                    })
                    
                    const reply = Math.random() <= 0.3 ? locale.activities['reset-wallet'].texts.confirmed_2 : locale.activities['reset-wallet'].texts.confirmed

                    await i.editReply({ content: `${self._emojis.OK} | ${self.translator.format(reply, `**${(interaction.member as any).displayName}**`)}`, components: [] })
                break

                case 'cancel':
                    await i.editReply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['reset-wallet'].texts.canceled, `**${(interaction.member as any).displayName}**`)}`, components: [] })
                break
            }
        })
    }

    else {
        await self.db.activities.updateOne({ _id: interaction.guildId }, {
            $pull: {
                wallets: {
                    user_id: member?.id ?? member_id
                } as never
            }
        })

        await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['reset-wallet'].texts.reset_user, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    }

    return true
}

export async function resetLevelSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const member = interaction.options?.getMember(locale.activities['reset-level'].options.user.name) as GuildMember
    const member_id = interaction.options?.getString(locale.activities['reset-level'].options.user_id.name)

    if (!member && !member_id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['reset-level'].texts.no_mention, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (member_id == 'all') {
        await self.db.activities.updateOne({ _id: interaction.guild.id }, {
            $set: {
                levels: []
            }
        })
    }

    else {
        await self.db.activities.updateOne({ _id: interaction.guild.id }, {
            $pull: {
                levels: {
                    user_id: member?.id ?? member_id
                } as never
            }
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['reset-level'].texts.reset_success, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

    return true
}