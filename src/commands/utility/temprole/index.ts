import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'USER',
            name: `commands.${name}.options.user.name`,
            description: `commands.${name}.options.user.description`,
            required: true
        },
        {
            type: 'ROLE',
            name: `commands.${name}.options.role.name`,
            description: `commands.${name}.options.role.description`,
            required: true
        },
        {
            type: 'STRING',
            name: `commands.${name}.options.duration.name`,
            description: `commands.${name}.options.duration.description`,
            required: true
        }
    ],
    group: 'UTILITY',
    permissions: {
        self: ['MANAGE_ROLES'],
        user: ['MANAGE_ROLES']
    }
}
