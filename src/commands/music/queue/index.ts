import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.QueueCommand.Description',
    group: CommandGroup.Music,
    slashFn: slash
}

export default options
