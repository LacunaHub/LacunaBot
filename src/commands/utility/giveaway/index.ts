import { ApplicationCommandOptionType } from 'discord.js'
import { createSlash, endSlash, removeSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'create',
            description: `commands.${name}.create.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.create.options.prize.name`,
                    description: `commands.${name}.create.options.prize.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.create.options.duration.name`,
                    description: `commands.${name}.create.options.duration.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: `commands.${name}.create.options.winners_amount.name`,
                    description: `commands.${name}.create.options.winners_amount.description`,
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.create.options.sponsor.name`,
                    description: `commands.${name}.create.options.sponsor.description`,
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
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.remove.options.message_id.name`,
                    description: `commands.${name}.remove.options.message_id.description`,
                    required: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'end',
            description: `commands.${name}.end.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: `commands.${name}.end.options.message_id.name`,
                    description: `commands.${name}.end.options.message_id.description`,
                    required: true
                }
            ]
        }
    ],
    group: 'UTILITY',
    subcommands: [
        {
            slash: createSlash,
            name: 'create'
        },
        {
            slash: removeSlash,
            name: 'remove'
        },
        {
            slash: endSlash,
            name: 'end'
        }
    ],
    permissions: {
        self: ['EMBED_LINKS'],
        user: ['MANAGE_MESSAGES']
    }
}
