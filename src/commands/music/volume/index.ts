import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.VolumeCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'Commands.Options.Volume',
            description: 'Commands.VolumeCommand.Options.Volume.Description',
            required: true,
            min_value: 1,
            max_value: 100
        }
    ],
    group: 'MUSIC',
    premium_only: true,
    permissions: {
        user: new PermissionsBitField(['ManageChannels']).toArray()
    }
}
