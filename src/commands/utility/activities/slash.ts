import { CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import Levels from '../../../modules/Levels'

export async function setLevelSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember(locale.activities['set-level'].options.user.name) as GuildMember
    const set_level = interaction.options?.getInteger(locale.activities['set-level'].options.level.name)

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-level'].texts.no_mention, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!set_level || set_level < 1 || set_level > 2500) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-level'].texts.no_level, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

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

    const level = user.activities.levels.find(i => i.guild_id == interaction.guildId)
    
    if (!level) {
        await self.db.users.updateOne({ _id: mention.id }, {
            $push: {
                'activities.levels': {
                    guild_id: interaction.guildId,
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
        await self.db.users.updateOne({ _id: mention.id, 'activities.levels.guild_id': interaction.guildId }, {
            $set: {
                'activities.levels.$.experience.level': set_level,
                'activities.levels.$.experience.current': 0,
                'activities.levels.$.experience.total': total_xp
            }
        })
    }

    await Levels.updateAwards(self, server, { member: mention, level: set_level })

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

    if (!amount && typeof amount !== 'number') {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.activities['set-wallet-balance'].texts.no_amount, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

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

    let wallet = user.activities.wallets.find(i => i.guild_id == interaction.guildId)

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

        await self.db.users.updateOne({ _id: mention.id }, {
            $push: { 'activities.wallets': wallet as never }
        })
    }

    const currency_id = server.modules.economy.currencies.find(c => c.name == currency || c.symbol == currency)?.id ?? 'DEFAULT'
    const { symbol: currency_symbol } = server.modules.economy.currencies.find(c => c.id == currency_id)
    
    if (wallet.currencies.some(c => c.id == currency_id)) {
        await self.db.users.updateOne({ _id: mention.id, 'activities.wallets': { $elemMatch: { guild_id: interaction.guildId, 'currencies.id': currency_id } } }, {
            $set: {
                'activities.wallets.$[guild].currencies.$[currency].amount': amount
            }
        }, { arrayFilters: [ { 'guild.guild_id': interaction.guildId }, { 'currency.id': currency_id } ] })
    }

    else {
        await self.db.users.updateOne({ _id: mention.id, 'activities.wallets.guild_id': interaction.guildId }, {
            $push: {
                'activities.wallets.$.currencies': {
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

    const activities = await self.db.users.find({ 'activities.wallets.guild_id': interaction.guildId })

    if (!activities.length) {
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
                    await self.db.users.updateMany({ 'activities.wallets.guild_id': interaction.guildId }, {
                        $pull: {
                            'activities.wallets': { guild_id: interaction.guildId }
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
        await self.db.users.updateOne({ _id: member?.id ?? member_id }, {
            $pull: {
                'activities.wallets': { guild_id: interaction.guildId }
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
        await self.db.users.updateMany({ 'activities.levels.guild_id': interaction.guildId }, {
            $pull: {
                'activities.levels': { guild_id: interaction.guildId }
            }
        })
    }

    else {
        await self.db.users.updateOne({ _id: member?.id ?? member_id }, {
            $pull: {
                'activities.levels': { guild_id: interaction.guildId }
            }
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.activities['reset-level'].texts.reset_success, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

    return true
}