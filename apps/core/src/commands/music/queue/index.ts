import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import slash from './slash.js'

const options: CommandOptions = {
    description: 'Commands.QueueCommand.Description',
    group: CommandGroup.Music,
    slashFn: slash
}

export default options
