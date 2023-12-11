import { ApplicationCommandOptionType } from 'discord.js'
import slash from './slash'
import user from './user'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    user,
    name,
    pretty_name: 'Commands.ReportCommand.Name',
    description: 'Commands.ReportCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'Commands.Options.User',
            description: 'Commands.ReportCommand.Options.User.Description',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'Commands.Options.Reason',
            description: 'Commands.ReportCommand.Options.Reason.Description',
            required: true,
            min_length: 20,
            max_length: 1000
        }
    ],
    group: 'MODERATION'
}
