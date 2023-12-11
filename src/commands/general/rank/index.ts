import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'
import user from './user'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    user,
    name,
    pretty_name: 'Commands.RankCommand.Name',
    description: 'Commands.RankCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.RankCommand.Options.User.Description',
            required: false
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks', 'AttachFiles']).toArray()
    }
}
