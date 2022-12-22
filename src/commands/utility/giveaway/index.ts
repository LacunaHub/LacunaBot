import { createSlash, endSlash, removeSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'SUB_COMMAND',
            name: 'create',
            description: `commands.${name}.create.description`,
            options: [
                {
                    type: 'STRING',
                    name: `commands.${name}.create.options.prize.name`,
                    description: `commands.${name}.create.options.prize.description`,
                    required: true
                },
                {
                    type: 'STRING',
                    name: `commands.${name}.create.options.duration.name`,
                    description: `commands.${name}.create.options.duration.description`,
                    required: true
                },
                {
                    type: 'INTEGER',
                    name: `commands.${name}.create.options.winners_amount.name`,
                    description: `commands.${name}.create.options.winners_amount.description`,
                    required: false
                },
                {
                    type: 'STRING',
                    name: `commands.${name}.create.options.sponsor.name`,
                    description: `commands.${name}.create.options.sponsor.description`,
                    required: false
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'remove',
            description: `commands.${name}.remove.description`,
            options: [
                {
                    type: 'STRING',
                    name: `commands.${name}.remove.options.message_id.name`,
                    description: `commands.${name}.remove.options.message_id.description`,
                    required: true
                }
            ]
        },
        {
            type: 'SUB_COMMAND',
            name: 'end',
            description: `commands.${name}.end.description`,
            options: [
                {
                    type: 'STRING',
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
