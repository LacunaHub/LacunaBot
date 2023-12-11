import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.TemproleCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.TemproleCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.Role,
            name: 'Commands.Options.Role',
            description: 'Commands.TemproleCommand.Options.Role.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Duration',
            description: 'Commands.TemproleCommand.Options.Duration.Description',
            required: true
        }
    ],
    group: 'UTILITY',
    permissions: {
        self: new PermissionsBitField(['ManageRoles']).toArray(),
        user: new PermissionsBitField(['ManageRoles']).toArray()
    }
}
