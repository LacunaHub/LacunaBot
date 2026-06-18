import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'

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
