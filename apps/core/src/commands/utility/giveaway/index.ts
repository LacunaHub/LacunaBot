import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { createSlash, endSlash, rerollSlash } from './slash.js'

const options: CommandOptions = {
    description: 'Commands.GiveawayCommand.Description',
    group: CommandGroup.Utility,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'create',
            description: 'Commands.GiveawayCommand.SubCommands.CreateCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.Prize',
                    description: 'Commands.GiveawayCommand.SubCommands.CreateCommand.Options.Prize.Description',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.Duration',
                    description: 'Commands.GiveawayCommand.SubCommands.CreateCommand.Options.Duration.Description',
                    required: true,
                    autocomplete: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.WinnerCount',
                    description: 'Commands.GiveawayCommand.SubCommands.CreateCommand.Options.WinnerCount.Description',
                    required: false,
                    minValue: 1,
                    maxValue: 50
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.Sponsor',
                    description: 'Commands.GiveawayCommand.SubCommands.CreateCommand.Options.Sponsor.Description',
                    required: false
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'end',
            description: 'Commands.GiveawayCommand.SubCommands.EndCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.MessageId',
                    description: 'Commands.GiveawayCommand.SubCommands.EndCommand.Options.MessageId.Description',
                    required: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'reroll',
            description: 'Commands.GiveawayCommand.SubCommands.RerollCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.MessageId',
                    description: 'Commands.GiveawayCommand.SubCommands.EndCommand.Options.MessageId.Description',
                    required: true
                }
            ]
        }
    ],
    defaultMemberPermissions: ['ManageMessages'],
    selfPermissions: ['EmbedLinks'],
    subcommandFns: {
        create: createSlash,
        end: endSlash,
        reroll: rerollSlash
    }
}

export default options
