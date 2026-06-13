import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'
import user from './user'

const options: CommandOptions = {
    prettyName: 'Commands.RankCommand.Name',
    description: 'Commands.RankCommand.Description',
    group: CommandGroup.General,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.RankCommand.Options.User.Description',
            required: false
        }
    ],
    selfPermissions: ['EmbedLinks', 'AttachFiles'],
    slashFn: slash,
    userFn: user
}

export default options
