import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import { balanceSlash, transferSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: 'Commands.WalletCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'balance',
            description: 'Commands.WalletCommand.SubCommands.BalanceCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'Commands.Options.User',
                    description: 'Commands.WalletCommand.SubCommands.BalanceCommand.Options.User.Description',
                    required: false
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'transfer',
            description: 'Commands.WalletCommand.SubCommands.TransferCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'Commands.Options.User',
                    description: 'Commands.WalletCommand.SubCommands.TransferCommand.Options.User.Description',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.Amount',
                    description: 'Commands.WalletCommand.SubCommands.TransferCommand.Options.Amount.Description',
                    required: true,
                    min_value: 1
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.Currency',
                    description: 'Commands.WalletCommand.SubCommands.TransferCommand.Options.Currency.Description',
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
        self: new PermissionsBitField(['EmbedLinks']).toArray()
    }
}
