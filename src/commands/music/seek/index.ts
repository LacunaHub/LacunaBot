import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.SeekCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Time',
            description: 'Commands.SeekCommand.Options.Time.Description',
            required: true
        }
    ],
    group: 'MUSIC',
    premium_only: true,
    permissions: {
        user: new PermissionsBitField(['ManageChannels']).toArray()
    }
}
