const fetch = require('node-fetch')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').Interaction} interaction
 */
const execute = async (self, interaction) => {
    const options = {
        method: 'POST',
        url: `https://discord.com/api/v8/interactions/${interaction.id}/${interaction.token}/callback`,
        headers: {
            Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 4,
            data: {
                content: '123'
            }
        })
    }

    const res = await fetch(options.url, options)
    console.log(res)
}

module.exports = {
    name: 'interactionCreate',
    fn: execute
}