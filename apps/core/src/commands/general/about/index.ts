import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import slash from './slash.js'

const options: CommandOptions = {
    description: 'Commands.AboutCommand.Description',
    group: CommandGroup.General,
    selfPermissions: ['EmbedLinks'],
    slashFn: slash
}

export default options
