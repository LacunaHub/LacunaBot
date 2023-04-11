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
            name: 'common.command_options.case_id',
            description: `commands.${name}.options.case_id.description`,
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'common.command_options.reason',
            description: `commands.${name}.options.reason.description`,
            required: true
        }
    ],
    group: 'MODERATION',
    permissions: {
        self: ['EMBED_LINKS'],
        user: ['MANAGE_ROLES']
    }
}
