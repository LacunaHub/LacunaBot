import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.MuteCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.MuteCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Duration',
            description: 'Commands.MuteCommand.Options.Duration.Description',
            required: false
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.MuteCommand.Options.Reason.Description',
            required: false
        }
    ],
    defaultMemberPermissions: ['ModerateMembers'],
    selfPermissions: ['EmbedLinks', 'ManageRoles', 'ModerateMembers'],
    slashFn: slash
}

export default options
