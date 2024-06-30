import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.ServerCommand.Description',
    group: CommandGroup.General,
    selfPermissions: ['EmbedLinks'],
    slashFn: slash
}

export default options
