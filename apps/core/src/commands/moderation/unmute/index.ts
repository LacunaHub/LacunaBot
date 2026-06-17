import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'

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
