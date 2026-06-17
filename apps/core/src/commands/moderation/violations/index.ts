import { CommandGroup, type CommandOptions } from '@/internals/structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash.js'

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
