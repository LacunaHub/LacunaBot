import fetch from 'node-fetch'
import logger from '../Logger'
import { scheduleJob, RecurrenceRule, Range, Job } from 'node-schedule'
import qdb from 'quick.db'
import ShardingManager from './ShardingManager'

export function scheduleStatsCollect(sharding: ShardingManager) {
    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 5)

    const job = scheduleJob(rule, async () => {
        if (!sharding.shards.every(shard => shard.ready)) return null

        const guildsSize: number[] = await sharding.fetchClientValues('guilds.cache.size') as number[]

        const guilds: number = guildsSize.reduce((a, b) => a + b, 0)
        const pings: number[] = await sharding.fetchClientValues('ws.ping') as number[]

        qdb.push('charts.guilds', { n: guilds, ts: Date.now() })
        qdb.push('charts.pings', { d: pings, ts: Date.now() })

        const g_charts: GuildsChart[] = qdb.get('charts.guilds')
        const p_charts: PingsChart[] = qdb.get('charts.pings')

        qdb.set('charts.guilds', g_charts.filter(c => (Date.now() - c.ts) < 259200000))
        qdb.set('charts.pings', p_charts.filter(c => (Date.now() - c.ts) < 64800000))

        await sendGuildCount(guilds)
    })

    logger.info(`(Utility): Guilds chart update schedule has been initialized`)

    return job
}

export async function sendGuildCount(guilds: number) {
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

    logger.log(`(Statistics): Guild count has been sent`)
}

export interface GuildsChart { n: number, ts: number }
export interface PingsChart { d: number[], ts: number }

export default { scheduleStatsCollect, sendGuildCount }