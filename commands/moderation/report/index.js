const message = require('./message')
const slash = require('./slash')

const name = __dirname.split(/\\/).pop()

module.exports = {
    message,
    slash,
    name,
    pretty_name: `commands.${name}.name`,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'STRING',
            name: `commands.${name}.options.message_id.name`,
            description: `commands.${name}.options.message_id.description`,
            required: true
        }
    ],
    group: 'MODERATION'
}