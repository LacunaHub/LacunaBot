import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.StopCommand.Description',
    group: CommandGroup.Music,
    defaultMemberPermissions: ['ManageChannels'],
    slashFn: slash
}

export default options
