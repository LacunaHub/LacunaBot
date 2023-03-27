import { ApplicationCommandOptionType } from 'discord.js'
import { addWalletBalanceSlash, resetLevelSlash, resetWalletSlash, setLevelSlash, setWalletBalanceSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'set-level',
            description: `commands.${name}.set-level.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: `commands.${name}.set-level.options.user.name`,
                    description: `commands.${name}.set-level.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: `commands.${name}.set-level.options.level.name`,
                    description: `commands.${name}.set-level.options.level.description`,
                    required: true,
                    min_value: 1,
                    max_value: 2500
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
                    name: `commands.${name}.add-wallet-balance.options.user.name`,
                    description: `commands.${name}.add-wallet-balance.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: `commands.${name}.add-wallet-balance.options.amount.name`,
                    description: `commands.${name}.add-wallet-balance.options.amount.description`,
                    required: true,
                    min_value: 1,
                    max_value: Math.pow(2, 31) - 1
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.add-wallet-balance.options.currency.name`,
                    description: `commands.${name}.add-wallet-balance.options.currency.description`,
                    required: false
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
                    name: `commands.${name}.set-wallet-balance.options.user.name`,
                    description: `commands.${name}.set-wallet-balance.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: `commands.${name}.set-wallet-balance.options.amount.name`,
                    description: `commands.${name}.set-wallet-balance.options.amount.description`,
                    required: true,
                    min_value: -(Math.pow(2, 31) - 1),
                    max_value: Math.pow(2, 31) - 1
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.set-wallet-balance.options.currency.name`,
                    description: `commands.${name}.set-wallet-balance.options.currency.description`,
                    required: false
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
                    name: `commands.${name}.reset-wallet.options.user.name`,
                    description: `commands.${name}.reset-wallet.options.user.description`,
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.reset-wallet.options.user_id.name`,
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
                    name: `commands.${name}.reset-level.options.user.name`,
                    description: `commands.${name}.reset-level.options.user.description`,
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.reset-level.options.user_id.name`,
                    description: `commands.${name}.reset-level.options.user_id.description`,
                    required: false
                }
            ]
        }
    ],
    group: 'UTILITY',
    subcommands: [
        {
            name: 'set-level',
            slash: setLevelSlash
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
