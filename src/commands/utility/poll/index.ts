import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import { createSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: 'Commands.PollCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'create',
            description: 'Commands.PollCommand.SubCommands.CreateCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.QuizMode',
                    description: 'Commands.PollCommand.SubCommands.CreateCommand.Options.QuizMode.Description',
                    choices: [
                        {
                            name: 'Common.Yes',
                            value: 1
                        },
                        {
                            name: 'Common.No',
                            value: 0
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.MultipleAnswers',
                    description: 'Commands.PollCommand.SubCommands.CreateCommand.Options.MultipleAnswers.Description',
                    choices: [
                        {
                            name: 'Common.Yes',
                            value: 1
                        },
                        {
                            name: 'Common.No',
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
        self: new PermissionsBitField(['EmbedLinks']).toArray(),
        user: new PermissionsBitField(['ManageMessages']).toArray()
    }
}
