import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.AboutCommand.Description',
    group: CommandGroup.General,
    selfPermissions: ['EmbedLinks'],
    slashFn: slash
}

export default options
