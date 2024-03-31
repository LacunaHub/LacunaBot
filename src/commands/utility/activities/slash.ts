import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChatInputCommandInteraction } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import Levels from '../../../modules/Levels'

export async function assignLevelAward(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user'),
        awardId = interaction.options?.getString('award')

    if (!mention) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.AssignLevelAwardCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const award = server.modules.levels.awards.find(v => v.id === awardId)

    if (!award) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.AssignLevelAwardCommand.Texts.UnknownAward', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

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

    let userLevel = user.activities.levels.find(v => v.guild_id === interaction.guildId)
    const awardLevel = +(award.conditions ? award.conditions.level : award.level) || 0,
        awardSentMessages = +award.conditions?.sent_messages || 0,
        awardVoiceTime = +award.conditions?.voice_time || 0

    if (userLevel) {
        if (awardLevel > 0 && awardLevel > userLevel.experience.level) {
            let totalXp = 0

            for (let i = 0; i < awardLevel; i++) {
                totalXp += 150 + i * i * 8
            }

            userLevel.experience.current = 0
            userLevel.experience.level = awardLevel
            userLevel.experience.total = totalXp
        }

        if (awardSentMessages > 0 && awardSentMessages > userLevel.activity.total_messages) {
            userLevel.activity.total_messages = awardSentMessages
        }

        if (awardVoiceTime > 0 && awardVoiceTime > userLevel.activity.total_voice_time) {
            userLevel.activity.total_voice_time = awardVoiceTime
        }

        await self.db.users.updateOne(
            { _id: mention.id, 'activities.levels.guild_id': interaction.guildId },
            {
                $set: {
                    'activities.levels.$.activity.total_messages': userLevel.activity.total_messages,
                    'activities.levels.$.activity.total_voice_time': userLevel.activity.total_voice_time,
                    'activities.levels.$.experience.current': userLevel.experience.current,
                    'activities.levels.$.experience.level': userLevel.experience.level,
                    'activities.levels.$.experience.total': userLevel.experience.total
                }
            }
        )
    } else {
        let level = 0,
            totalXp = 0,
            sentMessages = 0,
            voiceTime = 0

        if (awardLevel > 0) {
            level = awardLevel

            for (let i = 0; i < awardLevel; i++) {
                totalXp += 150 + i * i * 8
            }
        }

        if (awardSentMessages > 0) {
            sentMessages = awardSentMessages
        }

        if (awardVoiceTime > 0) {
            voiceTime = awardVoiceTime
        }

        userLevel = {
            guild_id: interaction.guildId,
            experience: {
                current: 0,
                level: level,
                total: totalXp
            },
            activity: {
                total_messages: sentMessages,
                last_message_at: null,
                total_voice_time: voiceTime,
                voice_connected_at: null
            }
        }

        await self.db.users.updateOne(
            { _id: mention.id },
            {
                $push: {
                    'activities.levels': userLevel
                }
            }
        )
    }

    await Levels.updateAwards(self, server, mention, userLevel, award)
    await interaction.editReply({
        content: `${self.staticEmojis.OK} | ${t('Commands.ActivitiesCommand.SubCommands.AssignLevelAwardCommand.Texts.AwardHasBeenAssigned', {
            username: `**${interaction.member.displayName}**`
        })}`
    })

    return true
}

export async function setWalletBalanceSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getUser('user')
    let amount = interaction.options?.getInteger('amount')
    const currency = interaction.options?.getString('currency')
    let operation = interaction.options?.getInteger('operation') ?? 2

    if (!mention) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!amount && typeof amount !== 'number') {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Texts.InvalidAmount', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    let user = await self.db.users.findOne({ _id: mention.id })

    if (!user) {
        user = await self.db.users.create({
            _id: mention.id,
            user: {
                username: mention.username,
                discriminator: mention.discriminator,
                avatar: mention.avatar,
                flags: mention.flags?.bitfield ?? 0,
                global_name: mention.globalName
            }
        } as any)
    }

    let wallet = user.activities.wallets.find(i => i.guild_id === interaction.guildId)

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

        await self.db.users.updateOne(
            { _id: mention.id },
            {
                $push: { 'activities.wallets': wallet as never }
            }
        )
    }

    const currencyId = server.modules.economy.currencies.find(i => i.id === currency)?.id ?? 'DEFAULT'
    const walletCurrency = wallet.currencies.find(i => i.id === currencyId)
    const INT32_MAX = Math.pow(2, 31) - 1

    if (operation === 2) amount = Math.abs(amount)
    if (operation === 3) amount = -amount

    if (amount > INT32_MAX || amount < -INT32_MAX) amount = amount > INT32_MAX ? INT32_MAX : amount < -INT32_MAX ? -INT32_MAX : 0
    if (amount < 0 && (walletCurrency?.amount ?? 0) - Math.abs(amount) < 0) amount = -(walletCurrency?.amount ?? 0)
    if (isNaN(amount)) amount = 0

    if (walletCurrency) {
        await self.db.users.updateOne(
            { _id: mention.id, 'activities.wallets': { $elemMatch: { guild_id: interaction.guildId, 'currencies.id': currencyId } } },
            {
                [operation === 1 ? `$set` : '$inc']: {
                    'activities.wallets.$[guild].currencies.$[currency].amount': amount
                }
            },
            { arrayFilters: [{ 'guild.guild_id': interaction.guildId }, { 'currency.id': currencyId }] }
        )
    } else {
        await self.db.users.updateOne(
            { _id: mention.id, 'activities.wallets.guild_id': interaction.guildId },
            {
                $push: {
                    'activities.wallets.$.currencies': {
                        id: currencyId,
                        amount
                    }
                }
            }
        )
    }

    await interaction.editReply({
        content: `${self.staticEmojis.OK} | ${t('Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Texts.WalletBalanceHasBeenSet', {
            username: `**${interaction.member.displayName}**`,
            target: `**${mention.displayName}**`
        })}`
    })

    return true
}

export async function resetWalletSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    await interaction.deferReply({ ephemeral: true })
    const activities = await self.db.users.find({ 'activities.wallets.guild_id': interaction.guildId })

    if (!activities.length) {
        await interaction.editReply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.ResetWalletCommand.Texts.NoExistingWallets', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    const mention = interaction.options?.getUser('user')
    const resetAll = interaction.options?.getInteger('reset-all')

    if (!mention && !resetAll) {
        await interaction.editReply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.ResetWalletCommand.Texts.NoRequiredArgs', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    if (mention) {
        await self.db.users.updateOne(
            { _id: mention.id },
            {
                $pull: {
                    'activities.wallets': { guild_id: interaction.guildId }
                }
            }
        )

        await interaction.editReply({
            content: `${self.staticEmojis.OK} | ${t('Commands.ActivitiesCommand.SubCommands.ResetWalletCommand.Texts.UserWalletHasBeenReset', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    } else if (resetAll === 2) {
        await self.db.users.updateMany(
            { 'activities.wallets.guild_id': interaction.guildId },
            {
                $pull: {
                    'activities.wallets': { guild_id: interaction.guildId }
                }
            }
        )

        await interaction.editReply({
            content: `${self.staticEmojis.OK} | ${t('Commands.ActivitiesCommand.SubCommands.ResetWalletCommand.Texts.AllWalletsHaveBeenReset', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    } else {
        await interaction.editReply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.ResetWalletCommand.Texts.NoRequiredArgs', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    }

    return true
}

export async function resetLevelSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    await interaction.deferReply({ ephemeral: true })
    const activities = await self.db.users.find({ 'activities.levels.guild_id': interaction.guildId })

    if (!activities.length) {
        await interaction.editReply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.ResetLevelCommand.Texts.NoExistingLevels', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    const mention = interaction.options?.getUser('user')
    const resetAll = interaction.options?.getInteger('reset-all')

    if (!mention && !resetAll) {
        await interaction.editReply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.ResetLevelCommand.Texts.NoRequiredArgs', {
                username: `**${interaction.member.displayName}**`
            })}`
        })

        return false
    }

    if (mention) {
        await self.db.users.updateOne(
            { _id: mention.id },
            {
                $pull: {
                    'activities.levels': { guild_id: interaction.guildId }
                }
            }
        )

        await interaction.editReply({
            content: `${self.staticEmojis.OK} | ${t('Commands.ActivitiesCommand.SubCommands.ResetLevelCommand.Texts.UserLevelHasBeenReset', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    } else if (resetAll === 2) {
        await self.db.users.updateMany(
            { 'activities.levels.guild_id': interaction.guildId },
            {
                $pull: {
                    'activities.levels': { guild_id: interaction.guildId }
                }
            }
        )

        await interaction.editReply({
            content: `${self.staticEmojis.OK} | ${t('Commands.ActivitiesCommand.SubCommands.ResetLevelCommand.Texts.AllLevelsHaveBeenReset', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    } else {
        await interaction.editReply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.ActivitiesCommand.SubCommands.ResetLevelCommand.Texts.NoRequiredArgs', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    }

    return true
}
