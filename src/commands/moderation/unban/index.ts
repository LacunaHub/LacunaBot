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
            name: 'common.command_options.user_id',
            description: `commands.${name}.options.user_id.description`,
            required: true,
            autocomplete: true
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
        self: ['EMBED_LINKS', 'BAN_MEMBERS'],
        user: ['BAN_MEMBERS']
    }
}
