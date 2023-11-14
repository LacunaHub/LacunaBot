import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    EmbedField,
    GuildMember,
    Message
} from 'discord.js'
import { ServerDocument, WarningsViolator } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember

    await interaction.deferReply({ ephemeral: true })

    if (mention) {
        const violator = server.moderation.warnings.violators.find(v => v.user_id === mention.id)

        if (!violator || !violator.violations.length) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.violations.text_no_violations', {
                    user: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        const last24Hr = violator.violations.filter(v => Date.now() - v.timestamp < 86400000)
        const last7d = violator.violations.filter(v => Date.now() - v.timestamp < 604800000)
        const last10Violations = violator.violations.slice(Math.max(violator.violations.length - 10, 0)).sort((a, b) => a.timestamp - b.timestamp)

        const embed = new EmbedBuilder()
            .setAuthor({
                name: t('commands.violations.text_user_violations', { target: mention.user.tag }),
                iconURL: mention.user.displayAvatarURL()
            })
            .addFields([
                { name: t('commands.violations.text_last_24_hours'), value: last24Hr.length.toString(), inline: true },
                { name: t('commands.violations.text_last_7_days'), value: last7d.length.toString(), inline: true },
                { name: t('commands.violations.text_total_violations'), value: violator.violations.length.toString(), inline: true },
                {
                    name: t('commands.violations.text_last_10_violations'),
                    value: last10Violations
                        .map((v, i) => `${i + 1}. **${v.reason || '-'}** – <t:${Math.round(v.timestamp / 1000)}:R> \`${v.id}\``)
                        .join('\n')
                }
            ])

        await interaction.editReply({ embeds: [embed] })
    } else {
        const violators = server.moderation.warnings.violators.sort((a, b) => b.violations.length - a.violations.length)

        if (!violators.length) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.violations.text_no_violations_on_server', {
                    user: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        const chunks: WarningsViolator[][] = chunkArray(violators, 9)
        const embed = new EmbedBuilder().setTitle(t('commands.violations.text_violator_list')),
            embedFields = []

        for (const chunk of chunks) {
            const current = []

            for (const violator of chunk) {
                const index = violators.findIndex(v => v.user_id === violator.user_id)

                current.push({
                    name: `#${index + 1}`,
                    value: `<@!${violator.user_id}>\n**${t('commands.violations.text_total_violations')}**: ${violator.violations.length}`,
                    inline: true
                })
            }

            embedFields.push(current)
        }

        let page: number = 0
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('backward')
                .setStyle(ButtonStyle.Secondary)
                .setLabel(t('commands.leaders.text_previous_page'))
                .setDisabled(embedFields.length == 1),
            new ButtonBuilder()
                .setCustomId('forward')
                .setStyle(ButtonStyle.Secondary)
                .setLabel(t('commands.leaders.text_next_page'))
                .setDisabled(embedFields.length == 1)
        )

        const field = embedFields[page]

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
                    page = page <= 0 ? embedFields.length - 1 : page - 1
                    break

                case 'forward':
                    page = page + 1 >= embedFields.length ? 0 : page + 1
                    break
            }

            await i.deferUpdate()
            const field: EmbedField[] = embedFields[page]

            await i.editReply({
                embeds: [
                    embed.setFields(field).setFooter({ text: t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }) })
                ],
                components: [row]
            })

            collector.resetTimer()
        })
    }

    return true
}
