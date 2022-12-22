import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'INTEGER',
            name: `commands.${name}.options.amount.name`,
            description: `commands.${name}.options.amount.description`,
            required: true
        },
        {
            type: 'USER',
            name: `commands.${name}.options.user.name`,
            description: `commands.${name}.options.user.description`,
            required: false
        },
        {
            type: 'STRING',
            name: `commands.${name}.options.reason.name`,
            description: `commands.${name}.options.reason.description`,
            required: false
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
        user: ['MANAGE_MESSAGES']
    }
}
