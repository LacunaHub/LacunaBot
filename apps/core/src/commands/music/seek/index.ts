import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'

const options: CommandOptions = {
    description: 'Commands.SeekCommand.Description',
    group: CommandGroup.Music,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Time',
            description: 'Commands.SeekCommand.Options.Time.Description',
            required: true
        }
    ],
    defaultMemberPermissions: ['ManageChannels'],
    premium: true,
    slashFn: slash
}

export default options
