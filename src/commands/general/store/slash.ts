import { CommandInteraction, GuildMember, Message, MessageActionRow, MessageEmbed, MessageSelectMenu } from 'discord.js'
import { EconomyStoreItem, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray } from '../../../internals/utility/Utils'
import { purchaseItem } from '../../../modules/Economy'
import Replacer from '../../../modules/Replacer'

export async function buySlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.economy.active) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.economy_disabled, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!server.modules.economy.store.items.length) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.no_store_items, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const sku = interaction.options?.getString(locale.store.buy.options.sku.name)

    if (!sku) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.buy.texts.no_sku, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const item = server.modules.economy.store.items.slice(0, (server.server.premium.available ? 200 : 50)).find(i => i.id == sku)

    if (!item) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.buy.texts.item_not_found, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const result = await purchaseItem(item, self, interaction.guild, interaction.member as GuildMember)

    if (result == 'INSUFFICIENT_FUNDS') {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.insufficient_funds, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    }

    if (result == 'PURCHASED') {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.purchased, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    }

    if (result == 'SUCCESS') {
        if (item.options.includes('CUSTOM_PURCHASE_REPLY')) {
            const replacer = new Replacer(null, { guild: interaction.guild, member: interaction.member as any })
            const content = await replacer.replaceTemplateMessage(item.custom_purchase_reply)

            try {
                await interaction.reply({ ...content, ephemeral: true })
            } catch (err) {
                await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.store.texts.purchase_success, `**${(interaction.member as any).displayName}**`, `**${item.name}**`)}`, ephemeral: true })
            }
        }

        else await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.store.texts.purchase_success, `**${(interaction.member as any).displayName}**`, `**${item.name}**`)}`, ephemeral: true })
    }

    return true
}

export async function itemsSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.economy.active) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.economy_disabled, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!server.modules.economy.store.items.length) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.no_store_items, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }
    
    let page: number = interaction.options?.getInteger(locale.store.items.options.page.name) ? (interaction.options.getInteger(locale.store.items.options.page.name) - 1) : 0
    const chunks: Array<EconomyStoreItem[]> = chunkArray(
        server.modules.economy.store.items.slice(0, (server.server.premium.available ? 200 : 50)).filter(i => !i.options.includes('LIMITED_QUANTITY') || i.quantity > 0), 8
    )

    if ((page + 1) > chunks.length) page = chunks.length - 1

    const fields = [], select_options = []

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true })

    for (const chunk of chunks) {
        const current_fields = [], current_select_options = []

        for (const item of chunk) {
            const currency = server.modules.economy.currencies.find(c => c.id == item.currency_id)

            current_fields.push({
                name: item.name,
                value: `
                    ${item.description ? `${item.description}` : ''}
                    **${locale.store.items.texts.purchase_price}**: ${item.purchase_price ? `${item.purchase_price}${currency.symbol}` : locale.store.items.texts.price_free} (SKU: ${item.id})
                    **${locale.store.items.texts.contains}**: ${item.references.map(r => `<${item.type == 'CHANNEL' ? '#' : '@&'}${r}>`).join(' ')}${item.options.includes('LIMITED_QUANTITY') ? `\n**${locale.store.items.texts.quantity}**: ${item.quantity}` : ''}
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

    const embed = new MessageEmbed()
        .setTitle(locale.store.items.texts.server_store)
        .setDescription(self.translator.format(locale.store.items.texts.server_store_description, '`/store buy <артикул>`'))
    
    const row = new MessageActionRow()

    const message = await interaction.editReply({
        embeds: [ embed.setFields(fields[page]).setFooter({ text: self.translator.format(locale.leaders.texts.pagination, (page + 1), chunks.length) }) ],
        components: [
            row.setComponents(
                new MessageSelectMenu({
                    customId: interaction.id,
                    placeholder: locale.store.items.texts.select_item,
                    options: chunks.length > 1 ? [ ...select_options[page], { label: locale.store.items.texts.previous_page, value: 'previous-page' }, { label: locale.store.items.texts.next_page, value: 'next-page' } ] : select_options[page]
                })
            )
        ]
    }) as Message

    const collector = message.createMessageComponentCollector({
        componentType: 'SELECT_MENU',
        time: 180000
    })

    collector.on('collect', async i => {
        const value = i.values[0]

        if (['previous-page', 'next-page'].includes(value)) {
            if (value == 'previous-page') page = page <= 0 ? (fields.length - 1) : (page - 1)
            if (value == 'next-page') page = (page + 1) >= fields.length ? 0 : (page + 1)

            await i.deferUpdate()

            await i.editReply({
                embeds: [ embed.setFields(fields[page]).setFooter({ text: self.translator.format(locale.leaders.texts.pagination, (page + 1), chunks.length) }) ],
                components: [
                    row.setComponents(
                        new MessageSelectMenu({
                            customId: i.id,
                            placeholder: locale.store.items.texts.select_item,
                            options: chunks.length > 1 ? [ ...select_options[page], { label: locale.store.items.texts.previous_page, value: 'previous-page' }, { label: locale.store.items.texts.next_page, value: 'next-page' } ] : select_options[page]
                        })
                    )
                ]
            })
        }

        else {
            await i.deferUpdate()

            const item = server.modules.economy.store.items.slice(0, (server.server.premium.available ? 200 : 50)).find(i => i.id == value)
            const result = await purchaseItem(item, self, interaction.guild, interaction.member as GuildMember)

            if (result == 'INSUFFICIENT_FUNDS') {
                await i.followUp({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.insufficient_funds, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
            }

            if (result == 'PURCHASED') {
                await i.followUp({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.store.texts.purchased, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
            }

            if (result == 'SUCCESS') {
                if (item.options.includes('CUSTOM_PURCHASE_REPLY')) {
                    const replacer = new Replacer(null, { guild: interaction.guild, member: interaction.member as any })
                    const content = await replacer.replaceTemplateMessage(item.custom_purchase_reply)
        
                    try {
                        await i.followUp({ ...content, ephemeral: true })
                    } catch (err) {
                        await i.followUp({ content: `${self._emojis.OK} | ${self.translator.format(locale.store.texts.purchase_success, `**${(interaction.member as any).displayName}**`, `**${item.name}**`)}`, ephemeral: true })
                    }
                }

                else await i.followUp({ content: `${self._emojis.OK} | ${self.translator.format(locale.store.texts.purchase_success, `**${(interaction.member as any).displayName}**`, `**${item.name}**`)}`, ephemeral: true })
            }
        }

        collector.resetTimer()
    })

    return true
}