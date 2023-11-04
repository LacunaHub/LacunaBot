import fetch from 'node-fetch'
import { Range, RecurrenceRule, scheduleJob } from 'node-schedule'
import database from '../../database'
import { bridgeClient } from '../Cluster'
import Lacuna from '../Lacuna'
import logger from '../Logger'

const totalShards = Number(process.env.DISCORD_CLIENT_TOTAL_SHARDS)
const shardsPerCluster = Number(process.env.DISCORD_CLIENT_SHARDS_PER_CLUSTER)

export function scheduleStatsCollect() {
    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 10)

    const job = scheduleJob(rule, async () => {
        const stats = await bridgeClient.broadcastEval((self: Lacuna) => {
                return {
                    guildCount: self.guilds.cache.size,
                    latency: self.ws.ping,
                    commandUsageCount: self.commands
                        .filter(c => c.is_slash_command)
                        .map(c => {
                            return { name: c.name, uses: c.uses }
                        })
                }
            }),
            flatStats = stats.flat()

        // check if all shards are spawned
        if (flatStats.length < totalShards / shardsPerCluster) return

        const totalGuilds: number = flatStats.reduce((a, b) => a + b.guildCount, 0)
        const storedStats: StatsMetrics = (await database.qdb.get('stats.metrics')) ?? {
            total_guilds: [],
            shard_latencies: [],
            command_usage_count: []
        }
        const dateNow = Date.now()

        storedStats.total_guilds.push({ data: totalGuilds, timestamp: dateNow })
        storedStats.shard_latencies.push({ data: flatStats.map(i => i.latency), timestamp: dateNow })
        storedStats.command_usage_count.push({
            data: flatStats
                .flatMap(i => i.commandUsageCount)
                .reduce((x, y) => {
                    x[y.name] = x[y.name] ? x[y.name] + y.uses : y.uses
                    return x
                }, {}),
            timestamp: dateNow
        })

        await database.qdb.set('stats.metrics', {
            total_guilds: storedStats.total_guilds.filter(i => dateNow - i.timestamp < 1000 * 60 * 60 * 24 * 2),
            shard_latencies: storedStats.shard_latencies.filter(i => dateNow - i.timestamp < 1000 * 60 * 60 * 12),
            command_usage_count: storedStats.command_usage_count.filter(i => dateNow - i.timestamp < 1000 * 60 * 60 * 12)
        })

        if (process.env.NODE_ENV !== 'development') await sendBotStatsToListings(totalGuilds)
    })

    logger.log(`[Statistics] Bot stats collection was scheduled`)

    return job
}

export async function sendBotStatsToListings(guilds: number) {
    try {
        const topGGResponse = await fetch(`https://top.gg/api/bots/${process.env.DISCORD_CLIENT_ID}/stats`, {
                method: 'POST',
                headers: {
                    Authorization: process.env.LISTING_TOP_GG_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ server_count: guilds })
            }),
            botsGGResponse = await fetch(`https://discord.bots.gg/api/v1/bots/${process.env.DISCORD_CLIENT_ID}/stats`, {
                method: 'POST',
                headers: {
                    Authorization: process.env.LISTING_BOTS_GG_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ guildCount: guilds })
            })

        if (topGGResponse.ok && botsGGResponse.ok) {
            logger.log(`[Statistics] Bot stats successfully posted`)

            return {
                topGG: await topGGResponse.json(),
                botsGG: await botsGGResponse.json()
            }
        }

        throw new Error('Failed to post bot stats')
    } catch (err) {
        logger.error('[Statistics]', err)
    }
}

export interface StatsMetrics {
    total_guilds: StatsMetricsData[]
    shard_latencies: StatsMetricsData[]
    command_usage_count: StatsMetricsData[]
}

export interface StatsMetricsData {
    data: any | any[]
    timestamp: number
}

export default { scheduleStatsCollect, sendBotStatsToListings }
