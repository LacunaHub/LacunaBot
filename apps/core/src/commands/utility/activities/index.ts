import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { assignLevelAward, resetLevelSlash, resetWalletSlash, setWalletBalanceSlash } from './slash.js'

const options: CommandOptions = {
    description: 'Commands.ActivitiesCommand.Description',
    group: CommandGroup.Utility,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'assign-level-award',
            description: 'Commands.ActivitiesCommand.SubCommands.AssignLevelAwardCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'Commands.Options.User',
                    description:
                        'Commands.ActivitiesCommand.SubCommands.AssignLevelAwardCommand.Options.User.Description',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.Award',
                    description:
                        'Commands.ActivitiesCommand.SubCommands.AssignLevelAwardCommand.Options.Award.Description',
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'set-wallet-balance',
            description: 'Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'Commands.Options.User',
                    description: `Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Options.User.Description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.Amount',
                    description:
                        'Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Options.Amount.Description',
                    required: true,
                    minValue: -(Math.pow(2, 31) - 1),
                    maxValue: Math.pow(2, 31) - 1
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.Currency',
                    description:
                        'Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Options.Currency.Description',
                    required: false,
                    autocomplete: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.Operation',
                    description:
                        'Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Options.Operation.Description',
                    required: false,
                    minValue: 1,
                    maxValue: 3,
                    choices: [
                        {
                            name: 'Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Options.Operation.ChoiceSet',
                            value: 1
                        },
                        {
                            name: 'Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Options.Operation.ChoiceInc',
                            value: 2
                        },
                        {
                            name: 'Commands.ActivitiesCommand.SubCommands.SetWalletBalanceCommand.Options.Operation.ChoiceSub',
                            value: 3
                        }
                    ]
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'reset-wallet',
            description: 'Commands.ActivitiesCommand.SubCommands.ResetWalletCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'Commands.Options.User',
                    description: 'Commands.ActivitiesCommand.SubCommands.ResetWalletCommand.Options.User.Description',
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.ResetAll',
                    description:
                        'Commands.ActivitiesCommand.SubCommands.ResetWalletCommand.Options.ResetAll.Description',
                    required: false,
                    minValue: 1,
                    maxValue: 2,
                    choices: [
                        {
                            name: 'Common.No',
                            value: 1
                        },
                        {
                            name: 'Common.Yes',
                            value: 2
                        }
                    ]
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'reset-level',
            description: 'Commands.ActivitiesCommand.SubCommands.ResetLevelCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'Commands.Options.User',
                    description: 'Commands.ActivitiesCommand.SubCommands.ResetLevelCommand.Options.User.Description',
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.ResetAll',
                    description:
                        'Commands.ActivitiesCommand.SubCommands.ResetLevelCommand.Options.ResetAll.Description',
                    required: false,
                    minValue: 1,
                    maxValue: 2,
                    choices: [
                        {
                            name: 'Common.No',
                            value: 1
                        },
                        {
                            name: 'Common.Yes',
                            value: 2
                        }
                    ]
                }
            ]
        }
    ],
    defaultMemberPermissions: ['Administrator'],
    subcommandFns: {
        'assign-level-award': assignLevelAward,
        'set-wallet-balance': setWalletBalanceSlash,
        'reset-wallet': resetWalletSlash,
        'reset-level': resetLevelSlash
    }
}

export default options
