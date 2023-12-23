import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import { createSlash, endSlash, rerollSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: 'Commands.GiveawayCommand.Description',
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
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'Commands.Options.WinnerCount',
                    description: 'Commands.GiveawayCommand.SubCommands.CreateCommand.Options.WinnerCount.Description',
                    required: false,
                    min_value: 1,
                    max_value: 50
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
        self: new PermissionsBitField(['EmbedLinks']).toArray(),
        user: new PermissionsBitField(['ManageMessages']).toArray()
    }
}
