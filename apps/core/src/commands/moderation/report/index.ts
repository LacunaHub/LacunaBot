import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'
import user from './user.js'

const options: CommandOptions = {
    prettyName: 'Commands.ReportCommand.Name',
    description: 'Commands.ReportCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.ReportCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.ReportCommand.Options.Reason.Description',
            required: true,
            minLength: 20,
            maxLength: 1000
        }
    ],
    slashFn: slash,
    userFn: user
}

export default options
