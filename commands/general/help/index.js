const prefix = require('./prefix')
const slash = require('./slash')

const name = __dirname.split(/\\/).pop()

module.exports = {
    prefix,
    slash,
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'STRING',
            name: `commands.${name}.options.command.name`,
            description: `commands.${name}.options.command.description`,
            required: false
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: ['EMBED_LINKS']
    }
}