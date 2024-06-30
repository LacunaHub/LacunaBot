import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.TemproleCommand.Description',
    group: CommandGroup.Utility,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.TemproleCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.Role,
            name: 'Commands.Options.Role',
            description: 'Commands.TemproleCommand.Options.Role.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Duration',
            description: 'Commands.TemproleCommand.Options.Duration.Description',
            required: true
        }
    ],
    defaultMemberPermissions: ['ManageRoles'],
    selfPermissions: ['ManageRoles'],
    slashFn: slash
}

export default options
