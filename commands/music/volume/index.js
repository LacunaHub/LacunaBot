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
            type: 'INTEGER',
            name: `commands.${name}.options.volume.name`,
            description: `commands.${name}.options.volume.description`,
            required: true
        }
    ],
    group: 'MUSIC',
    premium_only: true,
    permissions: {
        user: ['MANAGE_CHANNELS']
    }
}