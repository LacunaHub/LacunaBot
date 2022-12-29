import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: `commands.${name}.description`,
    options: [
        {
            type: 'INTEGER',
            name: `commands.${name}.options.sorting.name`,
            description: `commands.${name}.options.sorting.description`,
            required: false,
            choices: [
                {
                    name: `commands.${name}.options.sorting.choices.level`,
                    value: 1
                },
                {
                    name: `commands.${name}.options.sorting.choices.balance`,
                    value: 2
                }
            ]
        },
        {
            type: 'INTEGER',
            name: `commands.${name}.options.page.name`,
            description: `commands.${name}.options.page.description`,
            required: false,
            min_value: 1
        }
    ],
    group: 'GENERAL',
    permissions: {
        self: ['EMBED_LINKS']
    }
}
