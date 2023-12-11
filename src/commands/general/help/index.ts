import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.HelpCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Command',
            description: 'Commands.HelpCommand.Options.Command.Description',
            required: false,
            autocomplete: true
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks']).toArray()
    }
}
