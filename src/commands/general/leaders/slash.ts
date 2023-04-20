import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, Message } from 'discord.js'
import numbro from 'numbro'
import { ServerDocument } from '../../../database/schemas/Servers'
import { IUserLevel, IUserWallet } from '../../../database/schemas/Users'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray, isSnowflake } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)
    const locale = self.i18n.locale(server.locale)

    let sorting = interaction.options?.getInteger('sorting') ?? 1
    let page: number = interaction.options?.getInteger('page') ? interaction.options.getInteger('page') - 1 : 0

    const fields = []
    let chunks: Array<IUserLevel[] | IUserWallet[]> = []

    const sorting_choices = Object.values(locale.commands.leaders.options.sorting.choices)

    if (sorting > sorting_choices.length || sorting < 1) sorting = 1

    const embed = new EmbedBuilder().setTitle(t('commands.leaders.text_leaders_by', { sort: sorting_choices[sorting - 1] }))

    await interaction.deferReply({ ephemeral: true })

    if (sorting == 1) {
        if (!server.modules.levels.active && !server.modules.levels.voice) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.leaders.text_levels_disabled', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`
            })

            return false
        }

        const activities = (await self.db.users.find({ 'activities.levels.guild_id': interaction.guildId })).map(i => ({
            user: { id: i._id, ...i.user },
            ...i.activities.levels.find(i => i.guild_id == interaction.guildId)
        }))

        if (!activities?.length) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.leaders.text_no_levels', { user: `**${(interaction.member as any).displayName}**` })}`
            })

            return false
        }

        const sorted = activities.sort((a, b) => b.experience.total - a.experience.total)
        chunks = chunkArray(sorted, 9)

        for (const chunk of chunks) {
            const current = []

            for (const level of chunk as IUserLevel[]) {
                const index = sorted.indexOf(level as any)

                const current_xp_format =
                    level.experience.current >= 1000
                        ? numbro(Math.floor(level.experience.current)).format({ average: true, mantissa: 1 }).toUpperCase()
                        : level.experience.current.toFixed(1)
                const total_xp_format =
                    level.experience.total >= 1000
                        ? numbro(Math.floor(level.experience.total)).format({ average: true, mantissa: 1 }).toUpperCase()
                        : level.experience.total.toFixed(1)
                const voice_time = numbro(level.activity.total_voice_time).format({ output: 'time' })

                const username = (level as any).user?.username ?? (level as any)?.user?.id

                current.push({
                    name: `#${index + 1} ${username}`,
                    value: `${t('commands.leaders.text_level', {
                        level: level.experience.level
                    })} → :sparkles: ${current_xp_format} – ${total_xp_format}\n:incoming_envelope: ${
                        level.activity.total_messages
                    } :microphone2: ${voice_time}`,
                    inline: true
                })
            }

            fields.push(current)
        }
    }

    if (sorting == 2) {
        if (!server.modules.economy.active) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.leaders.text_economy_disabled', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`
            })

            return false
        }

        const activities = (await self.db.users.find({ 'activities.wallets.guild_id': interaction.guildId })).map(i => ({
            user: { id: i._id, ...i.user },
            ...i.activities.wallets.find(i => i.guild_id == interaction.guildId)
        }))

        if (!activities?.length) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.leaders.text_no_wallets', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`
            })

            return false
        }

        const sorted = activities.sort((a, b) => b.currencies.reduce((x, y) => x + y.amount, 0) - a.currencies.reduce((x, y) => x + y.amount, 0))
        chunks = chunkArray(sorted, 9)

        for (const chunk of chunks) {
            const current = []

            for (const wallet of chunk as IUserWallet[]) {
                const index = sorted.indexOf(wallet as any)

                const currencies = wallet.currencies
                    .map(i => {
                        const currency = server.modules.economy.currencies.find(c => c.id == i.id)

                        if (currency) return `${currency.name} → ${i.amount.toFixed(2)}${currency.symbol}`
                    })
                    .join('\n')

                const username = (wallet as any).user?.username ?? (wallet as any)?.user?.id

                current.push({
                    name: `#${index + 1} ${username}`,
                    value: currencies,
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
            .setLabel(t('commands.leaders.text_previous_page'))
            .setDisabled(fields.length == 1),
        new ButtonBuilder()
            .setCustomId('forward')
            .setStyle(ButtonStyle.Secondary)
            .setLabel(t('commands.leaders.text_next_page'))
            .setDisabled(fields.length == 1)
    )

    const field = fields[page]

    const message = (await interaction.editReply({
        embeds: [embed.setFields(field).setFooter({ text: t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }) })],
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
        const field = fields[page]

        for (const chunk of field) {
            const [index, user_id] = chunk.name.split(' ')
            const member = isSnowflake(user_id) ? await interaction.guild.members.fetch(user_id).catch(() => {}) : user_id

            chunk.name = `${index} ${member?.displayName ?? user_id}`
        }

        await i.editReply({
            embeds: [embed.setFields(field).setFooter({ text: t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }) })],
            components: [row]
        })

        collector.resetTimer()
    })

    return true
}
