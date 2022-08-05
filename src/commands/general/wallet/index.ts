import { balancePrefix, transferPrefix } from './prefix'
import { balanceSlash, transferSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    prefix: async (self, server, message) => {
        const help = self.commands.get('help')

        message.args = [name]

        await help.executePrefix(server, message)

        return true
    },
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'SUB_COMMAND',
            name: 'balance',
            description: `commands.${name}.balance.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.balance.options.user.name`,
                    description: `commands.${name}.balance.options.user.description`,
                    required: false
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'transfer',
            description: `commands.${name}.transfer.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.transfer.options.user.name`,
                    description: `commands.${name}.transfer.options.user.description`,
                    required: true
                },
                {
                    type: 'INTEGER',
                    name: `commands.${name}.transfer.options.amount.name`,
                    description: `commands.${name}.transfer.options.amount.description`,
                    required: true,
                    min_value: 1
                },
                {
                    type: 'STRING',
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
            prefix: balancePrefix,
            slash: balanceSlash
        },
        {
            name: 'transfer',
            prefix: transferPrefix,
            slash: transferSlash
        }
    ],
    permissions: {
        self: ['EMBED_LINKS']
    }
}
