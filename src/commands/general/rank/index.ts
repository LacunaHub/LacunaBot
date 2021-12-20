import prefix from './prefix'
import slash from './slash'
import user from './user'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    prefix,
    slash,
    user,
    name,
    pretty_name: `commands.${name}.name`,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'USER',
            name: `commands.${name}.options.user.name`,
            description: `commands.${name}.options.user.description`,
            required: false
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: ['EMBED_LINKS', 'ATTACH_FILES']
    }
}