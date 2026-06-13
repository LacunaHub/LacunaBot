import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import { buySlash, itemsSlash } from './slash'

const options: CommandOptions = {
    description: 'Commands.StoreCommand.Description',
    group: CommandGroup.General,
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
                    minValue: 1
                }
            ]
        }
    ],
    selfPermissions: ['EmbedLinks'],
    subcommandFns: {
        buy: buySlash,
        items: itemsSlash
    }
}

export default options
