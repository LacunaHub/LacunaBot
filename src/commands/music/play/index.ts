import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.PlayCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Query',
            description: 'Commands.PlayCommand.Options.Query.Description',
            required: true,
            autocomplete: true
        }
    ],
    group: 'MUSIC'
}
