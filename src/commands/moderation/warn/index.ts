import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import { addSlash, removeSlash } from './slash'

const options: CommandOptions = {
    description: 'Commands.WarnCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'add',
            description: 'Commands.WarnCommand.SubCommands.AddCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'Commands.Options.User',
                    description: 'Commands.WarnCommand.SubCommands.AddCommand.Options.User.Description',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.Reason',
                    description: 'Commands.WarnCommand.SubCommands.AddCommand.Options.Reason.Description',
                    required: false
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'remove',
            description: 'Commands.WarnCommand.SubCommands.RemoveCommand.Description',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'Commands.Options.User',
                    description: 'Commands.WarnCommand.SubCommands.RemoveCommand.Options.User.Description',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.WarnId',
                    description: 'Commands.WarnCommand.SubCommands.RemoveCommand.Options.WarnId.Description',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'Commands.Options.Reason',
                    description: 'Commands.WarnCommand.SubCommands.RemoveCommand.Options.Reason.Description',
                    required: false
                }
            ]
        }
    ],
    defaultMemberPermissions: ['ManageRoles'],
    selfPermissions: ['EmbedLinks'],
    subcommandFns: {
        add: addSlash,
        remove: removeSlash
    }
}

export default options
