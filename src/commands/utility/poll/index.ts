import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import { createSlash } from './slash'

const options: CommandOptions = {
    description: 'Commands.PollCommand.Description',
    group: CommandGroup.Utility,
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
    defaultMemberPermissions: ['ManageMessages'],
    selfPermissions: ['EmbedLinks'],
    subcommandFns: {
        create: createSlash
    }
}

export default options
