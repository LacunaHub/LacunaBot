import { buyPrefix, itemsPrefix } from './prefix'
import { buySlash, itemsSlash } from './slash'

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
            name: 'buy',
            description: `commands.${name}.buy.description`,
            options: [
                {
                    type: 'STRING',
                    name: `commands.${name}.buy.options.sku.name`,
                    description: `commands.${name}.buy.options.sku.description`,
                    required: true
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'items',
            description: `commands.${name}.items.description`,
            options: [
                {
                    type: 'INTEGER',
                    name: `commands.${name}.items.options.page.name`,
                    description: `commands.${name}.items.options.page.description`,
                    required: false,
                    min_value: 1
                }
            ]
        }
    ],
    group: 'GENERAL',
    subcommands: [
        {
            prefix: buyPrefix,
            slash: buySlash,
            name: 'buy'
        },
        {
            prefix: itemsPrefix,
            slash: itemsSlash,
            name: 'items'
        }
    ],
    permissions: {
        self: ['EMBED_LINKS']
    }
}