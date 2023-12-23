import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.ReasonCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'Commands.Options.CaseId',
            description: 'Commands.ReasonCommand.Options.CaseId.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.ReasonCommand.Options.Reason.Description',
            required: true
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks']).toArray(),
        user: new PermissionsBitField(['ManageRoles']).toArray()
    }
}
