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
            name: `commands.${name}.options.query.name`,
            description: `commands.${name}.options.query.description`,
            required: true
        }
    ],
    group: 'MUSIC'
}