import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: `commands.${name}.options.volume.name`,
            description: `commands.${name}.options.volume.description`,
            required: true,
            min_value: 1,
            max_value: 100
        }
    ],
    group: 'MUSIC',
    premium_only: true,
    permissions: {
        user: ['MANAGE_CHANNELS']
    }
}
