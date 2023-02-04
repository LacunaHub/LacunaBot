import fetch from 'node-fetch'
import { Range, RecurrenceRule, scheduleJob } from 'node-schedule'
import database from '../../database'
import { bridgeClient } from '../Cluster'
import Lacuna from '../Lacuna'
import logger from '../Logger'

export function scheduleStatsCollect() {
    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 5)

    const job = scheduleJob(rule, async () => {
        const stats = await bridgeClient.broadcastEval((self: Lacuna) => {
            return {
                guilds: self.guilds.cache.size,
                ping: self.ws.ping,
                commandUses: self.commands
                    .filter(c => c.is_slash_command)
                    .map(c => {
                        return { name: c.name, uses: c.uses }
                    })
            }
        })
        const flatStats = stats.flat()

        const guilds: number = flatStats.reduce((a, b) => a + b.guilds, 0)
        const pings: number[] = flatStats.map(i => i.ping)
        const commands: { [key: string]: number } = flatStats
            .flatMap(i => i.commandUses)
            .reduce((x, y) => {
                x[y.name] = x[y.name] ? x[y.name] + y.uses : y.uses
                return x
            }, {})

        await database.qdb.push('charts.guilds', { n: guilds, ts: Date.now() })
        await database.qdb.push('charts.pings', { d: pings, ts: Date.now() })
        await database.qdb.push('charts.command_uses', { d: commands, ts: Date.now() })

        const charts: { guilds: GuildsChart[]; pings: PingsChart[]; command_uses: any[] } = (await database.qdb.get('charts')) as any

        await database.qdb.set(
            'charts.guilds',
            charts.guilds.filter(c => Date.now() - c.ts < 259200000)
        )
        await database.qdb.set(
            'charts.pings',
            charts.pings.filter(c => Date.now() - c.ts < 64800000)
        )
        await database.qdb.set(
            'charts.command_uses',
            charts.command_uses.filter(c => Date.now() - c.ts < 36000000)
        )

        if (process.env.NODE_ENV !== 'development') await sendBotStatsToListings(guilds)
    })

    logger.log(`[Statistics] Bot stats collection was scheduled`)

    return job
}

export async function sendBotStatsToListings(guilds: number) {
    await fetch(`https://discord.bots.gg/api/v1/bots/${process.env.DISCORD_CLIENT_ID}/stats`, {
        method: 'POST',
        headers: {
            Authorization: process.env.LISTING_BOTS_GG_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guildCount: guilds })
    })

    await fetch(`https://top.gg/api/bots/${process.env.DISCORD_CLIENT_ID}/stats`, {
        method: 'POST',
        headers: {
            Authorization: process.env.LISTING_TOP_GG_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ server_count: guilds })
    })

    logger.log(`[Statistics] Bot stats successfully sent to listings`)
}

export interface GuildsChart {
    n: number
    ts: number
}
export interface PingsChart {
    d: number[]
    ts: number
}

export default { scheduleStatsCollect, sendBotStatsToListings }
