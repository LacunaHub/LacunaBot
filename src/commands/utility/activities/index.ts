import { ApplicationCommandOptionType } from 'discord.js'
import { addWalletBalanceSlash, assignLevelAward, resetLevelSlash, resetWalletSlash, setWalletBalanceSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'assign-level-award',
            description: `commands.${name}.assign-level-award.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'common.command_options.user',
                    description: `commands.${name}.assign-level-award.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.award',
                    description: `commands.${name}.assign-level-award.options.award.description`,
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'add-wallet-balance',
            description: `commands.${name}.add-wallet-balance.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'common.command_options.user',
                    description: `commands.${name}.add-wallet-balance.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'common.command_options.amount',
                    description: `commands.${name}.add-wallet-balance.options.amount.description`,
                    required: true,
                    min_value: 1,
                    max_value: Math.pow(2, 31) - 1
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.currency',
                    description: `commands.${name}.add-wallet-balance.options.currency.description`,
                    required: false,
                    autocomplete: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'set-wallet-balance',
            description: `commands.${name}.set-wallet-balance.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'common.command_options.user',
                    description: `commands.${name}.set-wallet-balance.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'common.command_options.amount',
                    description: `commands.${name}.set-wallet-balance.options.amount.description`,
                    required: true,
                    min_value: -(Math.pow(2, 31) - 1),
                    max_value: Math.pow(2, 31) - 1
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.currency',
                    description: `commands.${name}.set-wallet-balance.options.currency.description`,
                    required: false,
                    autocomplete: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'reset-wallet',
            description: `commands.${name}.reset-wallet.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'common.command_options.user',
                    description: `commands.${name}.reset-wallet.options.user.description`,
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.user_id',
                    description: `commands.${name}.reset-wallet.options.user_id.description`,
                    required: false
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'reset-level',
            description: `commands.${name}.reset-level.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'common.command_options.user',
                    description: `commands.${name}.reset-level.options.user.description`,
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.user_id',
                    description: `commands.${name}.reset-level.options.user_id.description`,
                    required: false
                }
            ]
        }
    ],
    group: 'UTILITY',
    subcommands: [
        {
            name: 'assign-level-award',
            slash: assignLevelAward
        },
        {
            name: 'set-wallet-balance',
            slash: setWalletBalanceSlash
        },
        {
            name: 'add-wallet-balance',
            slash: addWalletBalanceSlash
        },
        {
            name: 'reset-wallet',
            slash: resetWalletSlash
        },
        {
            name: 'reset-level',
            slash: resetLevelSlash
        }
    ],
    permissions: {
        user: ['ADMINISTRATOR']
    }
}
