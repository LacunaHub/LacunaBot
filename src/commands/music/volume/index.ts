import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.VolumeCommand.Description',
    group: CommandGroup.Music,
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'Commands.Options.Volume',
            description: 'Commands.VolumeCommand.Options.Volume.Description',
            required: true,
            minValue: 1,
            maxValue: 100
        }
    ],
    defaultMemberPermissions: ['ManageChannels'],
    premium: true,
    slashFn: slash
}

export default options
