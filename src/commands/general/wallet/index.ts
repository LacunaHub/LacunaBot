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
                    name: `commands.${name}.balance.options.user.name`,
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
                    name: `commands.${name}.transfer.options.user.name`,
                    description: `commands.${name}.transfer.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: `commands.${name}.transfer.options.amount.name`,
                    description: `commands.${name}.transfer.options.amount.description`,
                    required: true,
                    min_value: 1
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.transfer.options.currency.name`,
                    description: `commands.${name}.transfer.options.currency.description`,
                    required: false
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
