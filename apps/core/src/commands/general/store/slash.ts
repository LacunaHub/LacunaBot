import { type ServerDocument, type ServerModulesEconomyStoreItem } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { chunkArray } from '@/internals/utility/Utils.js'
import { purchaseItem } from '@/modules/Economy.js'
import Replacer from '@/modules/Replacer.js'
import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    Message,
    StringSelectMenuBuilder,
    type APIEmbedField,
    type SelectMenuComponentOptionData
} from 'discord.js'

export async function buySlash(
    self: Lacuna,
    server: ServerDocument,
    interaction: ChatInputCommandInteraction<'cached'>
) {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.economy.active) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.LeadersCommand.Texts.EconomyIsDisabled', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!server.modules.economy.store.items.length) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.StoreCommand.Texts.NoItemsForPurchaseInStore', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const sku = interaction.options?.getString('sku')

    if (!sku) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.StoreCommand.SubCommands.BuyCommand.Texts.InvalidSKU',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    const item = server.modules.economy.store.items.slice(0, server.premium.available ? 200 : 50).find(i => i.id == sku)

    if (!item) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t(
                'Commands.StoreCommand.SubCommands.BuyCommand.Texts.ItemNotFound',
                {
                    username: `**${interaction.member.displayName}**`
                }
            )}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    const result = await purchaseItem(item, self, interaction.guild, interaction.member)

    if (result == 'INSUFFICIENT_FUNDS') {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.StoreCommand.Texts.InsufficientFundsToPurchaseItem', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    }

    if (result == 'PURCHASED') {
        await interaction.editReply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.StoreCommand.Texts.ItemPreviouslyPurchased', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    }

    if (result == 'SUCCESS') {
        if (item.options.includes('CUSTOM_PURCHASE_REPLY')) {
            try {
                const replacer = new Replacer(server.premium.available, {
                        guild: interaction.guild,
                        member: interaction.member
                    }),
                    messagePayload = await replacer.replaceTemplateMessage(item.custom_purchase_reply as any)

                await interaction.editReply(messagePayload)
            } catch (err) {
                await interaction.editReply({
                    content: `${self.staticEmojis.Check} | ${t('Commands.StoreCommand.Texts.UserHasPurchasedItem', {
                        username: `**${interaction.member.displayName}**`,
                        item: `**${item.name}**`
                    })}`
                })
            }
        } else {
            await interaction.editReply({
                content: `${self.staticEmojis.Check} | ${t('Commands.StoreCommand.Texts.UserHasPurchasedItem', {
                    username: `**${interaction.member.displayName}**`,
                    item: `**${item.name}**`
                })}`
            })
        }
    }

    return true
}

export async function itemsSlash(
    self: Lacuna,
    server: ServerDocument,
    interaction: ChatInputCommandInteraction<'cached'>
) {
    const t = self.i18n.t.bind(null, server.locale)

    if (!server.modules.economy.active) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.LeadersCommand.Texts.EconomyIsDisabled', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!server.modules.economy.store.items.length) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.StoreCommand.Texts.NoItemsForPurchaseInStore', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    let page: number = interaction.options?.getInteger('page') ? interaction.options.getInteger('page')! - 1 : 0
    const chunks: Array<ServerModulesEconomyStoreItem[]> = chunkArray(
        server.modules.economy.store.items
            .slice(0, server.premium.available ? 200 : 50)
            .filter(i => !i.options.includes('LIMITED_QUANTITY') || i.quantity! > 0),
        8
    )

    if (page + 1 > chunks.length) page = chunks.length - 1

    const fields: APIEmbedField[][] = [],
        select_options: SelectMenuComponentOptionData[][] = []

    for (const chunk of chunks) {
        const current_fields = [],
            current_select_options = []

        for (const item of chunk) {
            const currency = server.modules.economy.currencies.find(c => c.id == item.currency_id)!
            const purchasePrice =
                    `**${t('Commands.StoreCommand.SubCommands.ItemsCommand.Texts.PurchasePrice')}**: ` +
                    `${item.purchase_price}${currency.symbol} (SKU: ${item.id})`,
                itemContains =
                    `**${t('Commands.StoreCommand.SubCommands.ItemsCommand.Texts.ItemContains')}**: ` +
                    item.references.map(v => `<${item.type == 'CHANNEL' ? '#' : '@&'}${v}>`).join(' '),
                itemQuantity = item.options.includes('LIMITED_QUANTITY')
                    ? `**${t('Commands.StoreCommand.SubCommands.ItemsCommand.Texts.ItemQuantity')}**: ${item.quantity}`
                    : ''

            current_fields.push({
                name: item.name,
                value: item.description + `\n${purchasePrice}` + `\n${itemContains}` + `\n${itemQuantity}`
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
        .setTitle(t('Commands.StoreCommand.SubCommands.ItemsCommand.Texts.ServerStore'))
        .setDescription(
            t('Commands.StoreCommand.SubCommands.ItemsCommand.Texts.ServerStoreHowToBuyItem', {
                command: '`/store buy`'
            })
        )

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()

    const message = (await interaction.editReply({
        embeds: [
            embed
                .setFields(fields[page]!)
                .setFooter({ text: t('Common.Pagination', { current: page + 1, total: chunks.length }) })
        ],
        components: [
            row.setComponents(
                new StringSelectMenuBuilder({
                    customId: interaction.id,
                    placeholder: t('Commands.StoreCommand.SubCommands.ItemsCommand.Texts.SelectItemToPurchase'),
                    options:
                        chunks.length > 1
                            ? [
                                  ...select_options[page]!,
                                  { label: t('Common.PreviousPage'), value: 'previous-page' },
                                  { label: t('Common.NextPage'), value: 'next-page' }
                              ]
                            : select_options[page]!
                })
            )
        ]
    })) as Message

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 180000
    })

    collector.on('collect', async i => {
        const value = i.values[0]!

        if (['previous-page', 'next-page'].includes(value)) {
            if (value == 'previous-page') page = page <= 0 ? fields.length - 1 : page - 1
            if (value == 'next-page') page = page + 1 >= fields.length ? 0 : page + 1

            await i.deferUpdate()

            await i.editReply({
                embeds: [
                    embed
                        .setFields(fields[page]!)
                        .setFooter({ text: t('Common.Pagination', { current: page + 1, total: chunks.length }) })
                ],
                components: [
                    row.setComponents(
                        new StringSelectMenuBuilder({
                            customId: i.id,
                            placeholder: t('Commands.StoreCommand.SubCommands.ItemsCommand.Texts.SelectItemToPurchase'),
                            options:
                                chunks.length > 1
                                    ? [
                                          ...select_options[page]!,
                                          { label: t('Common.PreviousPage'), value: 'previous-page' },
                                          { label: t('Common.NextPage'), value: 'next-page' }
                                      ]
                                    : select_options[page]!
                        })
                    )
                ]
            })
        } else {
            await i.deferUpdate()

            const item = server.modules.economy.store.items
                .slice(0, server.premium.available ? 200 : 50)
                .find(i => i.id == value)!
            const result = await purchaseItem(item, self, interaction.guild, interaction.member)

            if (result == 'INSUFFICIENT_FUNDS') {
                await i.followUp({
                    content: `${self.staticEmojis.Cross} | ${t(
                        'Commands.StoreCommand.Texts.InsufficientFundsToPurchaseItem',
                        {
                            username: `**${interaction.member.displayName}**`
                        }
                    )}`,
                    ephemeral: true
                })
            }

            if (result == 'PURCHASED') {
                await i.followUp({
                    content: `${self.staticEmojis.Cross} | ${t('Commands.StoreCommand.Texts.ItemPreviouslyPurchased', {
                        username: `**${interaction.member.displayName}**`
                    })}`,
                    ephemeral: true
                })
            }

            if (result == 'SUCCESS') {
                if (item.options.includes('CUSTOM_PURCHASE_REPLY')) {
                    const replacer = new Replacer(server.premium.available, {
                            guild: interaction.guild,
                            member: interaction.member
                        }),
                        messagePayload = await replacer.replaceTemplateMessage(item.custom_purchase_reply as any)

                    try {
                        await i.followUp({ ...messagePayload, ephemeral: true })
                    } catch (err) {
                        await i.followUp({
                            content: `${self.staticEmojis.Check} | ${t(
                                'Commands.StoreCommand.Texts.UserHasPurchasedItem',
                                {
                                    username: `**${interaction.member.displayName}**`,
                                    item: `**${item.name}**`
                                }
                            )}`,
                            ephemeral: true
                        })
                    }
                } else {
                    await i.followUp({
                        content: `${self.staticEmojis.Check} | ${t('Commands.StoreCommand.Texts.UserHasPurchasedItem', {
                            username: `**${interaction.member.displayName}**`,
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
