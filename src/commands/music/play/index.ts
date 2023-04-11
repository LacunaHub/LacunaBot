import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'common.command_options.query',
            description: `commands.${name}.options.query.description`,
            required: true,
            autocomplete: true
        }
    ],
    group: 'MUSIC'
}
