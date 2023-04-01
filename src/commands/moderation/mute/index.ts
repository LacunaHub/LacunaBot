import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'common.command_options.user',
            description: `commands.${name}.options.user.description`,
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'common.command_options.duration',
            description: `commands.${name}.options.duration.description`,
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
        self: ['EMBED_LINKS', 'MANAGE_ROLES', 'MODERATE_MEMBERS'],
        user: ['MODERATE_MEMBERS']
    }
}
