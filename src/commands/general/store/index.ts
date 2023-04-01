import { ApplicationCommandOptionType } from 'discord.js'
import { buySlash, itemsSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'buy',
            description: `commands.${name}.buy.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.sku',
                    description: `commands.${name}.buy.options.sku.description`,
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'items',
            description: `commands.${name}.items.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'common.command_options.page',
                    description: `commands.${name}.items.options.page.description`,
                    required: false,
                    min_value: 1
                }
            ]
        }
    ],
    group: 'GENERAL',
    subcommands: [
        {
            slash: buySlash,
            name: 'buy'
        },
        {
            slash: itemsSlash,
            name: 'items'
        }
    ],
    permissions: {
        self: ['EMBED_LINKS']
    }
}
