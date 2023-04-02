import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash'
import user from './user'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    user,
    name,
    pretty_name: `commands.${name}.name`,
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
            name: 'common.command_options.reason',
            description: `commands.${name}.options.reason.description`,
            required: true,
            min_length: 20,
            max_length: 1000
        }
    ],
    group: 'MODERATION'
}
