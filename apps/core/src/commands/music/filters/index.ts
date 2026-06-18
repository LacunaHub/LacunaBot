import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import slash from './slash.js'

const options: CommandOptions = {
    description: 'Commands.FilterCommand.Description',
    group: CommandGroup.Music,
    defaultMemberPermissions: ['ManageChannels'],
    premium: true,
    slashFn: slash
}

export default options
