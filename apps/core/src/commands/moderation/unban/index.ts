import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'

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
