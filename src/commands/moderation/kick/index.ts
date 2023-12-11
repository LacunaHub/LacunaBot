import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.KickCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.KickCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.KickCommand.Options.Reason.Description',
            required: false
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks', 'KickMembers']).toArray(),
        user: new PermissionsBitField(['KickMembers']).toArray()
    }
}
