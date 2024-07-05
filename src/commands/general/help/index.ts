import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.HelpCommand.Description',
    group: CommandGroup.General,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Command',
            description: 'Commands.HelpCommand.Options.Command.Description',
            required: false,
            autocomplete: true
        }
    ],
    selfPermissions: ['EmbedLinks'],
    slashFn: slash
}

export default options
