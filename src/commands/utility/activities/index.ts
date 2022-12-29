import { addWalletBalanceSlash, resetLevelSlash, resetWalletSlash, setLevelSlash, setWalletBalanceSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'SUB_COMMAND',
            name: 'set-level',
            description: `commands.${name}.set-level.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.set-level.options.user.name`,
                    description: `commands.${name}.set-level.options.user.description`,
                    required: true
                },
                {
                    type: 'INTEGER',
                    name: `commands.${name}.set-level.options.level.name`,
                    description: `commands.${name}.set-level.options.level.description`,
                    required: true,
                    min_value: 0
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'add-wallet-balance',
            description: `commands.${name}.add-wallet-balance.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.add-wallet-balance.options.user.name`,
                    description: `commands.${name}.add-wallet-balance.options.user.description`,
                    required: true
                },
                {
                    type: 'INTEGER',
                    name: `commands.${name}.add-wallet-balance.options.amount.name`,
                    description: `commands.${name}.add-wallet-balance.options.amount.description`,
                    required: true,
                    min_value: 1,
                    max_value: Math.pow(2, 31) - 1
                },
                {
                    type: 'STRING',
                    name: `commands.${name}.add-wallet-balance.options.currency.name`,
                    description: `commands.${name}.add-wallet-balance.options.currency.description`,
                    required: false
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'set-wallet-balance',
            description: `commands.${name}.set-wallet-balance.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.set-wallet-balance.options.user.name`,
                    description: `commands.${name}.set-wallet-balance.options.user.description`,
                    required: true
                },
                {
                    type: 'INTEGER',
                    name: `commands.${name}.set-wallet-balance.options.amount.name`,
                    description: `commands.${name}.set-wallet-balance.options.amount.description`,
                    required: true,
                    min_value: -(Math.pow(2, 31) - 1),
                    max_value: Math.pow(2, 31) - 1
                },
                {
                    type: 'STRING',
                    name: `commands.${name}.set-wallet-balance.options.currency.name`,
                    description: `commands.${name}.set-wallet-balance.options.currency.description`,
                    required: false
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'reset-wallet',
            description: `commands.${name}.reset-wallet.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.reset-wallet.options.user.name`,
                    description: `commands.${name}.reset-wallet.options.user.description`,
                    required: false
                },
                {
                    type: 'STRING',
                    name: `commands.${name}.reset-wallet.options.user_id.name`,
                    description: `commands.${name}.reset-wallet.options.user_id.description`,
                    required: false
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'reset-level',
            description: `commands.${name}.reset-level.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.reset-level.options.user.name`,
                    description: `commands.${name}.reset-level.options.user.description`,
                    required: false
                },
                {
                    type: 'STRING',
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
