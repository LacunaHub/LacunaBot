import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.BanCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.BanCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Duration',
            description: 'Commands.BanCommand.Options.Duration.Description',
            required: false
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.BanCommand.Options.Reason.Description',
            required: false
        }
    ],
    defaultMemberPermissions: ['BanMembers'],
    selfPermissions: ['EmbedLinks', 'BanMembers'],
    slashFn: slash
}

export default options
