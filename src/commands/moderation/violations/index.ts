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
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: ['EMBED_LINKS', 'MANAGE_ROLES'],
        user: ['MANAGE_ROLES']
    }
}
