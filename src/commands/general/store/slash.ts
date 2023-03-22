import { ActionRowBuilder, ChatInputCommandInteraction, ComponentType, EmbedBuilder, GuildMember, Message, StringSelectMenuBuilder } from 'discord.js'
import { EconomyStoreItem, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray } from '../../../internals/utility/Utils'
import { purchaseItem } from '../../../modules/Economy'
import Replacer from '../../../modules/Replacer'

export async function buySlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.economy.active) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.leaders.text_economy_disabled', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!server.modules.economy.store.items.length) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.store.text_no_store_items', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const sku = interaction.options?.getString(self.i18n.t(interaction.locale, 'commands.store.buy.options.sku.name'))

    if (!sku) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.store.buy.text_no_sku', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const item = server.modules.economy.store.items.slice(0, server.server.premium.available ? 200 : 50).find(i => i.id == sku)

    if (!item) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.store.buy.text_item_not_found', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    const result = await purchaseItem(item, self, interaction.guild, interaction.member as GuildMember)

    if (result == 'INSUFFICIENT_FUNDS') {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.store.text_insufficient_funds', {
                user: `**${(interaction.member as any).displayName}**`
            })}`
        })
    }

    if (result == 'PURCHASED') {
        await interaction.editReply({
            content: `${self._emojis.ERROR} | ${t('commands.store.text_purchased', { user: `**${(interaction.member as any).displayName}**` })}`
        })
    }

    if (result == 'SUCCESS') {
        if (item.options.includes('CUSTOM_PURCHASE_REPLY')) {
            const replacer = new Replacer(null, { guild: interaction.guild, member: interaction.member as any })
            const content = await replacer.replaceTemplateMessage(item.custom_purchase_reply)

            try {
                await interaction.editReply({ ...content })
            } catch (err) {
                await interaction.editReply({
                    content: `${self._emojis.OK} | ${t('commands.store.text_purchase_success', {
                        user: `**${(interaction.member as any).displayName}**`,
                        item: `**${item.name}**`
                    })}`
                })
            }
        } else {
            await interaction.editReply({
                content: `${self._emojis.OK} | ${t('commands.store.text_purchase_success', {
                    user: `**${(interaction.member as any).displayName}**`,
                    item: `**${item.name}**`
                })}`
            })
        }
    }

    return true
}

export async function itemsSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.economy.active) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.leaders.text_economy_disabled', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!server.modules.economy.store.items.length) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.store.text_no_store_items', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    let page: number = interaction.options?.getInteger(self.i18n.t(interaction.locale, 'commands.store.items.options.page.name'))
        ? interaction.options.getInteger(self.i18n.t(interaction.locale, 'commands.store.items.options.page.name')) - 1
        : 0
    const chunks: Array<EconomyStoreItem[]> = chunkArray(
        server.modules.economy.store.items
            .slice(0, server.server.premium.available ? 200 : 50)
            .filter(i => !i.options.includes('LIMITED_QUANTITY') || i.quantity > 0),
        8
    )

    if (page + 1 > chunks.length) page = chunks.length - 1

    const fields = [],
        select_options = []

    for (const chunk of chunks) {
        const current_fields = [],
            current_select_options = []

        for (const item of chunk) {
            const currency = server.modules.economy.currencies.find(c => c.id == item.currency_id)

            current_fields.push({
                name: item.name,
                value: `
                    ${item.description ? `${item.description}` : ''}
                    **${t('commands.store.items.text_purchase_price')}**: ${
                    item.purchase_price ? `${item.purchase_price}${currency.symbol}` : t('commands.store.items.text_price_free')
                } (SKU: ${item.id})
                    **${t('commands.store.items.text_contains')}**: ${item.references
                    .map(r => `<${item.type == 'CHANNEL' ? '#' : '@&'}${r}>`)
                    .join(' ')}${
                    item.options.includes('LIMITED_QUANTITY') ? `\n**${t('commands.store.items.text_quantity')}**: ${item.quantity}` : ''
                }
                `
            })

            current_select_options.push({
                label: item.name,
                value: item.id,
                description: item.description
            })
        }

        fields.push(current_fields)
        select_options.push(current_select_options)
    }

    const embed = new EmbedBuilder()
        .setTitle(t('commands.store.items.text_server_store'))
        .setDescription(t('commands.store.items.text_server_store_description', { command: '`/store buy <артикул>`' }))

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()

    const message = (await interaction.editReply({
        embeds: [
            embed.setFields(fields[page]).setFooter({ text: t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }) })
        ],
        components: [
            row.setComponents(
                new StringSelectMenuBuilder({
                    customId: interaction.id,
                    placeholder: t('commands.store.items.text_select_item'),
                    options:
                        chunks.length > 1
                            ? [
                                  ...select_options[page],
                                  { label: t('commands.leaders.text_previous_page'), value: 'previous-page' },
                                  { label: t('commands.leaders.text_next_page'), value: 'next-page' }
                              ]
                            : select_options[page]
                })
            )
        ]
    })) as Message

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 180000
    })

    collector.on('collect', async i => {
        const value = i.values[0]

        if (['previous-page', 'next-page'].includes(value)) {
            if (value == 'previous-page') page = page <= 0 ? fields.length - 1 : page - 1
            if (value == 'next-page') page = page + 1 >= fields.length ? 0 : page + 1

            await i.deferUpdate()

            await i.editReply({
                embeds: [
                    embed
                        .setFields(fields[page])
                        .setFooter({ text: t('commands.leaders.text_pagination', { current: page + 1, total: chunks.length }) })
                ],
                components: [
                    row.setComponents(
                        new StringSelectMenuBuilder({
                            customId: i.id,
                            placeholder: t('commands.store.items.text_select_item'),
                            options:
                                chunks.length > 1
                                    ? [
                                          ...select_options[page],
                                          { label: t('commands.leaders.text_previous_page'), value: 'previous-page' },
                                          { label: t('commands.leaders.text_next_page'), value: 'next-page' }
                                      ]
                                    : select_options[page]
                        })
                    )
                ]
            })
        } else {
            await i.deferUpdate()

            const item = server.modules.economy.store.items.slice(0, server.server.premium.available ? 200 : 50).find(i => i.id == value)
            const result = await purchaseItem(item, self, interaction.guild, interaction.member as GuildMember)

            if (result == 'INSUFFICIENT_FUNDS') {
                await i.followUp({
                    content: `${self._emojis.ERROR} | ${t('commands.store.text_insufficient_funds', {
                        user: `**${(interaction.member as any).displayName}**`
                    })}`,
                    ephemeral: true
                })
            }

            if (result == 'PURCHASED') {
                await i.followUp({
                    content: `${self._emojis.ERROR} | ${t('commands.store.text_purchased', {
                        user: `**${(interaction.member as any).displayName}**`
                    })}`,
                    ephemeral: true
                })
            }

            if (result == 'SUCCESS') {
                if (item.options.includes('CUSTOM_PURCHASE_REPLY')) {
                    const replacer = new Replacer(null, { guild: interaction.guild, member: interaction.member as any })
                    const content = await replacer.replaceTemplateMessage(item.custom_purchase_reply)

                    try {
                        await i.followUp({ ...content, ephemeral: true })
                    } catch (err) {
                        await i.followUp({
                            content: `${self._emojis.OK} | ${t('commands.store.text_purchase_success', {
                                user: `**${(interaction.member as any).displayName}**`,
                                item: `**${item.name}**`
                            })}`,
                            ephemeral: true
                        })
                    }
                } else {
                    await i.followUp({
                        content: `${self._emojis.OK} | ${t('commands.store.text_purchase_success', {
                            user: `**${(interaction.member as any).displayName}**`,
                            item: `**${item.name}**`
                        })}`,
                        ephemeral: true
                    })
                }
            }
        }

        collector.resetTimer()
    })

    return true
}
