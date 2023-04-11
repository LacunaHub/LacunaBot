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
            required: false
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: ['EMBED_LINKS', 'ATTACH_FILES']
    }
}
