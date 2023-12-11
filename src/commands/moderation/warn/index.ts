import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import { addSlash, removeSlash } from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash: () => {},
    name,
    description: 'Commands.WarnCommand.Description',
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
    group: 'MODERATION',
    subcommands: [
        {
            slash: addSlash,
            name: 'add'
        },
        {
            slash: removeSlash,
            name: 'remove'
        }
    ],
    permissions: {
        self: new PermissionsBitField(['EmbedLinks']).toArray(),
        user: new PermissionsBitField(['ManageRoles']).toArray()
    }
}
