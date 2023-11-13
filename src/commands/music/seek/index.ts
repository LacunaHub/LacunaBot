import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'common.command_options.time',
            description: `commands.${name}.options.time.description`,
            required: true
        }
    ],
    group: 'MUSIC',
    premium_only: true,
    permissions: {
        user: ['MANAGE_CHANNELS']
    }
}
