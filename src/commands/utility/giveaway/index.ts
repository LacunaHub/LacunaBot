import { ApplicationCommandOptionType } from 'discord.js'
import { createSlash, endSlash, rerollSlash } from './slash'

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
                    name: 'common.command_options.prize',
                    description: `commands.${name}.create.options.prize.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.duration',
                    description: `commands.${name}.create.options.duration.description`,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'common.command_options.winners_amount',
                    description: `commands.${name}.create.options.winners_amount.description`,
                    required: false,
                    min_value: 1,
                    max_value: 50
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.sponsor',
                    description: `commands.${name}.create.options.sponsor.description`,
                    required: false
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
                    name: 'common.command_options.message_id',
                    description: `commands.${name}.end.options.message_id.description`,
                    required: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'reroll',
            description: `commands.${name}.reroll.description`,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'common.command_options.message_id',
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
            slash: endSlash,
            name: 'end'
        },
        {
            slash: rerollSlash,
            name: 'reroll'
        }
    ],
    permissions: {
        self: ['EMBED_LINKS'],
        user: ['MANAGE_MESSAGES']
    }
}
