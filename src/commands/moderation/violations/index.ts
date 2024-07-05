import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.ViolationsCommand.Description',
    group: CommandGroup.Moderation,
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.ViolationsCommand.Options.User.Description',
            required: false
        }
    ],
    defaultMemberPermissions: ['ManageRoles'],
    selfPermissions: ['EmbedLinks'],
    slashFn: slash
}

export default options
