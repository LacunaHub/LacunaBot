import { ApplicationCommandOptionType } from 'discord.js'
import { CommandGroup, CommandOptions } from '../../../internals/structures/Command'
import slash from './slash'

const options: CommandOptions = {
    description: 'Commands.LeadersCommand.Description',
    group: CommandGroup.General,
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
            minValue: 1
        }
    ],
    selfPermissions: ['EmbedLinks'],
    slashFn: slash
}

export default options
