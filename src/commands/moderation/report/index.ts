import message from './message'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
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