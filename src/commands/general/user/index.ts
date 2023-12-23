import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.UserCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.UserCommand.Options.User.Description',
            required: false
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks']).toArray()
    }
}
