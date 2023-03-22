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
            name: `commands.${name}.options.command.name`,
            description: `commands.${name}.options.command.description`,
            required: false,
            autocomplete: true
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: ['EMBED_LINKS']
    }
}
