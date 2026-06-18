import { brokerClient, lava } from '@/api/utility/Managers.js'
import database from '@/database/index.js'
import { indexToLetter } from '@/internals/utility/Utils.js'
import { type BrokerMessageDataMap, BrokerMessageType } from '@lacunahub/letsfrag'
import { type Context } from 'koa'

export default async function getState(ctx: Context) {
    const version = await database.qdb.get('version'),
        issues: string[] = []
    let stats: BrokerMessageDataMap[BrokerMessageType.RequestStatsResult] = {
        readyAt: 0,
        clients: [],
        managers: [],
        shardCount: 0,
        shardsPerManager: 0
    }

    try {
        stats = await brokerClient.request({ type: BrokerMessageType.RequestStats })
    } catch (err) {}

    const lavaNodes = [...lava.nodes.cache.values()].map(v => {
        return {
            id: v.options.name,
            connected: v.connected,
            cpu_load: +v.stats.cpu.lavalinkLoad.toFixed(2),
            memory_usage: Math.round((v.stats.memory.used * 100) / v.stats.memory.reservable),
            uptime: v.stats.uptime,
            players: {
                playing: v.stats.playingPlayers,
                total: v.stats.players
            }
        }
    })

    for (const node of lavaNodes) {
        if (!node.connected) {
            issues.push(`Player **${node.id}** is not connected.`)
        }

        if (node.cpu_load > 0.8) {
            issues.push(`Player **${node.id}** has high load.`)
        }
    }

    const clusters = stats.managers.flatMap((v, i) => {
        const host = indexToLetter(i)!.toUpperCase()
        return v.clusters.map(vv => ({ ...vv, host }))
    })

    ctx.status = 200
    ctx.body = {
        version,
        issues,
        guilds: clusters.reduce((a, b) => (a += b.guildCount), 0) || 0,
        users: clusters.reduce((a, b) => (a += b.userCount), 0) || 0,
        cached_users: clusters.reduce((a, b) => (a += b.cachedUserCount), 0) || 0,
        channels: clusters.reduce((a, b) => (a += b.channelCount), 0) || 0,
        shards: clusters.map(v => {
            return {
                host: v.host,
                id: v.id,
                guilds: v.guildCount,
                users: v.userCount,
                cached_users: v.cachedUserCount,
                channels: v.channelCount,
                latency: v.wsPing,
                uptime: v.uptime
            }
        }),
        players: lavaNodes,
        charts: {}
    }
}
