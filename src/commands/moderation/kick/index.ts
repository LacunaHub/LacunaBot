import prefix from './prefix'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    prefix,
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
            type: 'STRING',
            name: `commands.${name}.options.reason.name`,
            description: `commands.${name}.options.reason.description`,
            required: false
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: ['EMBED_LINKS', 'KICK_MEMBERS'],
        user: ['KICK_MEMBERS']
    }
}