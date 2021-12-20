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
            type: 'INTEGER',
            name: `commands.${name}.options.case_id.name`,
            description: `commands.${name}.options.case_id.description`,
            required: true
        },
        {
            type: 'STRING',
            name: `commands.${name}.options.reason.name`,
            description: `commands.${name}.options.reason.description`,
            required: true
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: ['EMBED_LINKS'],
        user: ['MANAGE_ROLES']
    }
}