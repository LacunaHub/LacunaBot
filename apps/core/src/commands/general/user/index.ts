import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.UserCommand.Description',
    group: CommandGroup.General,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.UserCommand.Options.User.Description',
            required: false
        }
    ],
    selfPermissions: ['EmbedLinks'],
    slashFn: slash
}

export default options
