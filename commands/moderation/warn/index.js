const { addPrefix, removePrefix } = require('./prefix')
const { addSlash, removeSlash } = require('./slash')

const name = __dirname.split(/\\/).pop()

module.exports = {
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
            name: 'add',
            description: `commands.${name}.add.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.add.options.user.name`,
                    description: `commands.${name}.add.options.user.description`,
                    required: true
                },
                {
                    type: 'STRING',
                    name: `commands.${name}.add.options.reason.name`,
                    description: `commands.${name}.add.options.reason.description`,
                    required: false
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'remove',
            description: `commands.${name}.remove.description`,
            options: [
                {
                    type: 'USER',
                    name: `commands.${name}.remove.options.user.name`,
                    description: `commands.${name}.remove.options.user.description`,
                    required: true
                },
                {
                    type: 'STRING',
                    name: `commands.${name}.remove.options.warn_id.name`,
                    description: `commands.${name}.remove.options.warn_id.description`,
                    required: true
                },
                {
                    type: 'STRING',
                    name: `commands.${name}.remove.options.reason.name`,
                    description: `commands.${name}.remove.options.reason.description`,
                    required: false
                }
            ]
        },
    ],
    group: 'MODERATION',
    subcommands: [
        {
            prefix: addPrefix,
            slash: addSlash,
            name: 'add'
        },
        {
            prefix: removePrefix,
            slash: removeSlash,
            name: 'remove'
        }
    ],
    permissions: {
        self: ['EMBED_LINKS'],
        user: ['MANAGE_ROLES']
    }
}