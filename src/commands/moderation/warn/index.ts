import { ApplicationCommandOptionType } from 'discord.js'
import { addSlash, removeSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'add',
            description: `commands.${name}.add.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: `commands.${name}.add.options.user.name`,
                    description: `commands.${name}.add.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.add.options.reason.name`,
                    description: `commands.${name}.add.options.reason.description`,
                    required: false
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'remove',
            description: `commands.${name}.remove.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: `commands.${name}.remove.options.user.name`,
                    description: `commands.${name}.remove.options.user.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.remove.options.warn_id.name`,
                    description: `commands.${name}.remove.options.warn_id.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.remove.options.reason.name`,
                    description: `commands.${name}.remove.options.reason.description`,
                    required: false
                }
            ]
        }
    ],
    group: 'MODERATION',
    subcommands: [
        {
            slash: addSlash,
            name: 'add'
        },
        {
            slash: removeSlash,
            name: 'remove'
        }
    ],
    permissions: {
        self: ['EMBED_LINKS'],
        user: ['MANAGE_ROLES']
    }
}
