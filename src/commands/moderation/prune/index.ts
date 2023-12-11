import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.PruneCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'Commands.Options.Amount',
            description: 'Commands.PruneCommand.Options.Amount.Description',
            required: true,
            min_value: 1,
            max_value: 100
        },
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.PruneCommand.Options.User.Description',
            required: false
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.PruneCommand.Options.Reason.Description',
            required: false
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks', 'ManageMessages']).toArray(),
        user: new PermissionsBitField(['ManageMessages']).toArray()
    }
}
