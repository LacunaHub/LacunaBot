const prefix = require('./prefix')
const slash = require('./slash')

const name = __dirname.split(/\\/).pop()

module.exports = {
    prefix,
    slash,
    name,
    description: `commands.${name}.description`,
    group: 'GENERAL',
    permissions: {
        self: ['EMBED_LINKS']
    }
}