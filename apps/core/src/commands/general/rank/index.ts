import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'
import user from './user.js'

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
