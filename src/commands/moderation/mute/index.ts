import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.MuteCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.MuteCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Duration',
            description: 'Commands.MuteCommand.Options.Duration.Description',
            required: false
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.MuteCommand.Options.Reason.Description',
            required: false
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks', 'ManageRoles', 'ModerateMembers']).toArray(),
        user: new PermissionsBitField(['ModerateMembers']).toArray()
    }
}
