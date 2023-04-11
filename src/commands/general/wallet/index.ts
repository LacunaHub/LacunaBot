import { ApplicationCommandOptionType } from 'discord.js'
import { balanceSlash, transferSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'balance',
            description: `commands.${name}.balance.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'common.command_options.user',
                    description: `commands.${name}.balance.options.user.description`,
                    required: false
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'transfer',
            description: `commands.${name}.transfer.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'common.command_options.user',
                    description: `commands.${name}.transfer.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'common.command_options.amount',
                    description: `commands.${name}.transfer.options.amount.description`,
                    required: true,
                    min_value: 1
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.currency',
                    description: `commands.${name}.transfer.options.currency.description`,
                    required: false,
                    autocomplete: true
                }
            ]
        }
    ],
    group: 'GENERAL',
    subcommands: [
        {
            name: 'balance',
            slash: balanceSlash
        },
        {
            name: 'transfer',
            slash: transferSlash
        }
    ],
    permissions: {
        self: ['EMBED_LINKS']
    }
}
