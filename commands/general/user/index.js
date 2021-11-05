const prefix = require('./prefix')
const slash = require('./slash')

const name = __dirname.split(/\\/).pop().split('/').pop()

module.exports = {
    prefix,
    slash,
    name,
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
        self: ['EMBED_LINKS']
    }
}