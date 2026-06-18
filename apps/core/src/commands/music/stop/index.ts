import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import slash from './slash.js'

const options: CommandOptions = {
    description: 'Commands.StopCommand.Description',
    group: CommandGroup.Music,
    defaultMemberPermissions: ['ManageChannels'],
    slashFn: slash
}

export default options
