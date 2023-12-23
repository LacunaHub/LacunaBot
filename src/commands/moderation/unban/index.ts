import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.UnbanCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.UserId',
            description: 'Commands.UnbanCommand.Options.UserId.Description',
            required: true,
            autocomplete: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.UnbanCommand.Options.Reason.Description',
            required: false
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks', 'BanMembers']).toArray(),
        user: new PermissionsBitField(['BanMembers']).toArray()
    }
}
