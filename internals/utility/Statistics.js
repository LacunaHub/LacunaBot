const fetch = require('node-fetch')
const Logger = require('../Logger')

class Statistics {
    static async sendGuildCount(guilds) {
        await fetch(`https://discord.bots.gg/api/v1/bots/${process.env.CLIENT_ID}/stats`, {
            method: 'POST',
            headers: {
                Authorization: process.env.BDGG_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ guildCount: guilds })
        })

        await fetch(`https://top.gg/api/bots/${process.env.CLIENT_ID}/stats`, {
            method: 'POST',
            headers: {
                Authorization: process.env.TOPGG_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ server_count: guilds })
        })

        await fetch(`https://api.server-discord.com/v2/bots/${process.env.CLIENT_ID}/stats`, {
            method: 'POST',
            headers: {
                Authorization: process.env.BOTSSD_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ servers: guilds })
        })

        await Logger.log(`(Statistics): Guild count has been sent`)
    }
}

module.exports = Statistics