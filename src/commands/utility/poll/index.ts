import { ApplicationCommandOptionType } from 'discord.js'
import { createSlash } from './slash'

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
                    type: ApplicationCommandOptionType.Integer,
                    name: `commands.${name}.create.options.quiz_mode.name`,
                    description: `commands.${name}.create.options.quiz_mode.description`,
                    choices: [
                        {
                            name: 'yes',
                            value: 1
                        },
                        {
                            name: 'no',
                            value: 0
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: `commands.${name}.create.options.multiple_answers.name`,
                    description: `commands.${name}.create.options.multiple_answers.description`,
                    choices: [
                        {
                            name: 'yes',
                            value: 1
                        },
                        {
                            name: 'no',
                            value: 0
                        }
                    ]
                }
            ]
        }
    ],
    group: 'UTILITY',
    subcommands: [
        {
            slash: createSlash,
            name: 'create'
        }
    ],
    permissions: {
        self: ['EMBED_LINKS'],
        user: ['MANAGE_MESSAGES']
    }
}
