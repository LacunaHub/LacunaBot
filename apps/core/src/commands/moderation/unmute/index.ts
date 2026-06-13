import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.UnmuteCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.UnmuteCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.UnmuteCommand.Options.Reason.Description',
            required: false
        }
    ],
    defaultMemberPermissions: ['ModerateMembers'],
    selfPermissions: ['EmbedLinks', 'ManageRoles', 'ModerateMembers'],
    slashFn: slash
}

export default options
