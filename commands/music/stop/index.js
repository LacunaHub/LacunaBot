const prefix = require('./prefix')
const slash = require('./slash')

const name = __dirname.split(/\\/).pop()

module.exports = {
    prefix,
    slash,
    name,
    description: `commands.${name}.description`,
    group: 'MUSIC',
    permissions: {
        user: ['MANAGE_CHANNELS']
    }
}