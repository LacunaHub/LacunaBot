import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.BanCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.BanCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Duration',
            description: 'Commands.BanCommand.Options.Duration.Description',
            required: false
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.BanCommand.Options.Reason.Description',
            required: false
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks', 'BanMembers']).toArray(),
        user: new PermissionsBitField(['BanMembers']).toArray()
    }
}
