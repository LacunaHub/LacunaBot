import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'

const options: CommandOptions = {
    description: 'Commands.PruneCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'Commands.Options.Amount',
            description: 'Commands.PruneCommand.Options.Amount.Description',
            required: true,
            minValue: 1,
            maxValue: 100
        },
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.PruneCommand.Options.User.Description',
            required: false
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.PruneCommand.Options.Reason.Description',
            required: false
        }
    ],
    defaultMemberPermissions: ['ManageMessages'],
    selfPermissions: ['EmbedLinks', 'ManageMessages'],
    slashFn: slash
}

export default options
