const fetch = require('node-fetch')
const Logger = require('../Logger')
const { scheduleJob, RecurrenceRule, Range } = require('node-schedule')
const qdb = require('quick.db')

class Statistics {
    /**
     * @param {import('discord.js').ShardingManager} manager
     */
    static async schedule(manager) {
        const rule = new RecurrenceRule()
        rule.minute = new Range(0, 59, 2)

        await scheduleJob(rule, async () => {
            if (!manager.shards.every(shard => shard.ready)) return null

            let guilds = await manager.fetchClientValues('guilds.cache.size')
            guilds = guilds.reduce((a, b) => a + b, 0)

            const pings = await manager.fetchClientValues('ws.ping')

            qdb.push('charts.guilds', { n: guilds, ts: Date.now() })
            qdb.push('charts.pings', { d: pings, ts: Date.now() })

            await Statistics.sendGuildCount(guilds)
        })

        await Logger.info(`(Utility): Guilds chart update schedule has been initialized`)
    }

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
                Authorization: `SDC ${process.env.BOTSSD_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ servers: guilds, shards: 0 })
        })

        await Logger.log(`(Statistics): Guild count has been sent`)
    }
}

module.exports = Statistics