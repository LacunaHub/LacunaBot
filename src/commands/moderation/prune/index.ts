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
            name: 'common.command_options.amount',
            description: `commands.${name}.options.amount.description`,
            required: true,
            min_value: 1,
            max_value: 100
        },
        {
            type: ApplicationCommandOptionType.User,
            name: 'common.command_options.user',
            description: `commands.${name}.options.user.description`,
            required: false
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'common.command_options.reason',
            description: `commands.${name}.options.reason.description`,
            required: false
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
        user: ['MANAGE_MESSAGES']
    }
}
