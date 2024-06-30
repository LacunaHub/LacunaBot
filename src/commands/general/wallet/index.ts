import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import { balanceSlash, transferSlash } from './slash'

const options: CommandOptions = {
    description: 'Commands.WalletCommand.Description',
    group: CommandGroup.General,
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
                    minValue: 1
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
    selfPermissions: ['EmbedLinks'],
    subcommandFns: {
        balance: balanceSlash,
        transfer: transferSlash
    }
}

export default options
