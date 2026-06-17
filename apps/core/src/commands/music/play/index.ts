import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'

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
