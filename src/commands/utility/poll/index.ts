import { createSlash } from './slash'

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
                    type: 'INTEGER',
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
                    type: 'INTEGER',
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
