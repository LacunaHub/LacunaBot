import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type UserLevel, type UserWallet } from '@/database/schemas/Users.js'
import Lacuna from '@/internals/Lacuna.js'
import { chunkArray } from '@/internals/utility/Utils.js'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    Message,
    type APIEmbedField
} from 'discord.js'
import numbro from 'numbro'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)
    const locale = self.i18n.locale(server.locale)

    let sorting = interaction.options?.getInteger('sorting') ?? 1
    let page: number = interaction.options?.getInteger('page') ? interaction.options.getInteger('page')! - 1 : 0

    const fields: APIEmbedField[][] = []
    let chunks: Array<UserLevel[] | UserWallet[]> = []
    const sorting_choices = [
        locale.Commands.LeadersCommand.Options.Sorting.ChoiceLevel,
        locale.Commands.LeadersCommand.Options.Sorting.ChoiceBalance
    ]

    if (sorting > sorting_choices.length || sorting < 1) sorting = 1

    const embed = new EmbedBuilder().setTitle(
        t('Commands.LeadersCommand.Texts.ServerLeadersBy', { sortBy: sorting_choices[sorting - 1] })
    )

    await interaction.deferReply({ ephemeral: true })

    if (sorting === 1) {
        if (!server.modules.levels.active && !server.modules.levels.voice) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.LeadersCommand.Texts.LevelsIsDisabled', {
                    username: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        const activities = (await self.db.users.find({ 'activities.levels.guild_id': interaction.guildId })).map(i => ({
            user: { id: i._id, ...i.user },
            ...i.activities.levels.find(i => i.guild_id === interaction.guildId)
        }))

        if (!activities?.length) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.LeadersCommand.Texts.NoLevelsYet', {
                    username: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        const sorted = activities.sort((a, b) => Number(b.experience?.total) - Number(a.experience?.total))
        chunks = chunkArray(sorted, 9)

        for (const chunk of chunks) {
            const current: APIEmbedField[] = []

            for (const level of chunk as UserLevel[]) {
                const index = sorted.indexOf(level as any)

                const currentXp =
                    level.experience.current >= 1000
                        ? // @ts-expect-error
                          numbro(Math.floor(level.experience.current))
                              .format({ average: true, mantissa: 1 })
                              .toUpperCase()
                        : level.experience.current.toFixed(1)
                const totalXp =
                    level.experience.total >= 1000
                        ? // @ts-expect-error
                          numbro(Math.floor(level.experience.total))
                              .format({ average: true, mantissa: 1 })
                              .toUpperCase()
                        : level.experience.total.toFixed(1)
                // @ts-expect-error
                const voiceTime = numbro(level.activity.total_voice_time).format({ output: 'time' })

                current.push({
                    name: `#${index + 1}`,
                    value: `<@!${(level as any)?.user?.id}>\n${t('Commands.LeadersCommand.Texts.CurrentLevel', {
                        level: level.experience.level
                    })} → :sparkles: ${currentXp} – ${totalXp}\n:incoming_envelope: ${level.activity.total_messages} :microphone2: ${voiceTime}`,
                    inline: true
                })
            }

            fields.push(current)
        }
    }

    if (sorting === 2) {
        if (!server.modules.economy.active) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.LeadersCommand.Texts.EconomyIsDisabled', {
                    username: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        const activities = (await self.db.users.find({ 'activities.wallets.guild_id': interaction.guildId })).map(
            i => ({
                user: { id: i._id, ...i.user },
                ...i.activities.wallets.find(i => i.guild_id === interaction.guildId)
            })
        )

        if (!activities?.length) {
            await interaction.editReply({
                content: `${self.staticEmojis.Cross} | ${t('Commands.LeadersCommand.Texts.NoWalletsYet', {
                    username: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        const sorted = activities.sort(
            (a, b) =>
                Number(b.currencies?.reduce((x, y) => x + y.amount, 0)) -
                Number(a.currencies?.reduce((x, y) => x + y.amount, 0))
        )
        chunks = chunkArray(sorted, 9)

        for (const chunk of chunks) {
            const current: APIEmbedField[] = []

            for (const wallet of chunk as UserWallet[]) {
                const index = sorted.indexOf(wallet as any)
                const currencies = wallet.currencies
                    .map(i => {
                        const currency = server.modules.economy.currencies.find(c => c.id == i.id)

                        if (currency) return `${currency.name} → ${i.amount.toFixed(2)}${currency.symbol}`
                    })
                    .join('\n')

                current.push({
                    name: `#${index + 1}`,
                    value: `<@!${(wallet as any)?.user?.id}>\n${currencies}`,
                    inline: true
                })
            }

            fields.push(current)
        }
    }

    if (page + 1 > chunks.length) page = chunks.length - 1

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('backward')
            .setStyle(ButtonStyle.Secondary)
            .setLabel(t('Common.PreviousPage'))
            .setDisabled(fields.length == 1),
        new ButtonBuilder()
            .setCustomId('forward')
            .setStyle(ButtonStyle.Secondary)
            .setLabel(t('Common.NextPage'))
            .setDisabled(fields.length == 1),
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel(t('Pages.GuildPage.Leaders.Leaderboard'))
            .setURL(`${process.env.LCN_WEBSITE_URL}/guilds/${interaction.guildId}/leaders`)
    )

    const field = fields[page]!

    const message = (await interaction.editReply({
        embeds: [
            embed
                .setFields(field)
                .setFooter({ text: t('Common.Pagination', { current: page + 1, total: chunks.length }) })
        ],
        components: [row]
    })) as Message

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
    })

    collector.on('collect', async i => {
        switch (i.customId) {
            case 'backward':
                page = page <= 0 ? fields.length - 1 : page - 1
                break

            case 'forward':
                page = page + 1 >= fields.length ? 0 : page + 1
                break
        }

        await i.deferUpdate()
        const field = fields[page]!

        await i.editReply({
            embeds: [
                embed
                    .setFields(field)
                    .setFooter({ text: t('Common.Pagination', { current: page + 1, total: chunks.length }) })
            ],
            components: [row]
        })

        collector.resetTimer()
    })

    return true
}
