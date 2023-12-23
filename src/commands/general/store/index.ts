import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import { buySlash, itemsSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: 'Commands.StoreCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'buy',
            description: 'Commands.StoreCommand.SubCommands.BuyCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.SKU',
                    description: 'Commands.StoreCommand.SubCommands.BuyCommand.Options.SKU.Description',
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'items',
            description: 'Commands.StoreCommand.SubCommands.ItemsCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.Page',
                    description: 'Commands.StoreCommand.SubCommands.ItemsCommand.Options.Page.Description',
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
        self: new PermissionsBitField(['EmbedLinks']).toArray()
    }
}
