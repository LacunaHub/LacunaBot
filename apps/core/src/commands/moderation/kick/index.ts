import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'

const options: CommandOptions = {
    description: 'Commands.KickCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.KickCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.KickCommand.Options.Reason.Description',
            required: false
        }
    ],
    defaultMemberPermissions: ['KickMembers'],
    selfPermissions: ['EmbedLinks', 'KickMembers'],
    slashFn: slash
}

export default options
