import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.LeadersCommand.Description',
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'Commands.Options.Sorting',
            description: 'Commands.LeadersCommand.Options.Sorting.Description',
            required: false,
            choices: [
                {
                    name: 'Commands.LeadersCommand.Options.Sorting.ChoiceLevel',
                    value: 1
                },
                {
                    name: 'Commands.LeadersCommand.Options.Sorting.ChoiceBalance',
                    value: 2
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'Commands.Options.Page',
            description: 'Commands.LeadersCommand.Options.Page.Description',
            required: false,
            min_value: 1
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks']).toArray()
    }
}
