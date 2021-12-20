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
            type: 'STRING',
            name: `commands.${name}.options.query.name`,
            description: `commands.${name}.options.query.description`,
            required: true
        }
    ],
    group: 'MUSIC'
}