import { setPrefix, resetPrefix } from './prefix'
import { setSlash, resetSlash } from './slash'

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
            name: 'set',
            description: `commands.${name}.set.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.set.options.user.name`,
                    description: `commands.${name}.set.options.user.description`,
                    required: true
                },
                {
                    type: 'INTEGER',
                    name: `commands.${name}.set.options.level.name`,
                    description: `commands.${name}.set.options.level.description`,
                    required: true
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'reset',
            description: `commands.${name}.reset.description`,
            options: [
                {
                    type: 'MENTIONABLE',
                    name: `commands.${name}.reset.options.user_or_role.name`,
                    description: `commands.${name}.reset.options.user_or_role.description`,
                    required: true
                }
            ]
        }
    ],
    group: 'UTILITY',
    subcommands: [
        {
            prefix: setPrefix,
            slash: setSlash,
            name: 'set'
        },
        {
            prefix: resetPrefix,
            slash: resetSlash,
            name: 'reset'
        }
    ],
    permissions: {
        user: ['ADMINISTRATOR']
    }
}