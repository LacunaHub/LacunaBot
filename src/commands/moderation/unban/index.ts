import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.UnbanCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.UserId',
            description: 'Commands.UnbanCommand.Options.UserId.Description',
            required: true,
            autocomplete: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.UnbanCommand.Options.Reason.Description',
            required: false
        }
    ],
    defaultMemberPermissions: ['BanMembers'],
    selfPermissions: ['EmbedLinks', 'BanMembers'],
    slashFn: slash
}

export default options
