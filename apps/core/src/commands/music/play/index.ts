import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.PlayCommand.Description',
    group: CommandGroup.Music,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Query',
            description: 'Commands.PlayCommand.Options.Query.Description',
            required: true,
            autocomplete: true
        }
    ],
    slashFn: slash
}

export default options
