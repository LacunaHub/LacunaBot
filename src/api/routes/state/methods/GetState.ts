import { ClusterShardClient } from '@lacunahub/letsfrag'
import { Context } from 'koa'
import { lava, serverClient } from '../../..'
import database from '../../../../database'
import { BotStats, StatsMetrics } from '../../../modules/Statistics'

export default async function getState(ctx: Context) {
    const version = await database.qdb.get('version')
    const stats = await serverClient.broadcastEval<BotStats[][]>((self: ClusterShardClient) => {
            return {
                clusterId: self.cluster.id,
                guilds: self.guilds.cache.size,
                users: self.guilds.cache.reduce((x, y) => (x += y.memberCount), 0),
                cachedUsers: self.users.cache.size,
                channels: self.channels.cache.size,
                latency: self.ws.ping,
                uptime: self.uptime
            }
        }),
        flatStats = stats.flat().sort((a, b) => a.clusterId - b.clusterId)
    const hosts = await serverClient.getHostsData()
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
    const metrics: StatsMetrics = (await database.qdb.get('stats.metrics')) ?? {
        total_guilds: [],
        shard_latencies: [],
        command_usage_count: []
    }

    ctx.status = 200
    ctx.body = {
        version,
        guilds: flatStats.reduce((a, b) => (a += b.guilds), 0) || 0,
        users: flatStats.reduce((a, b) => (a += b.users), 0) || 0,
        cached_users: flatStats.reduce((a, b) => (a += b.cachedUsers), 0) || 0,
        channels: flatStats.reduce((a, b) => (a += b.channels), 0) || 0,
        servers: hosts.map(v => {
            return {
                hostname: v.hostname,
                uptime: v.uptime,
                cpu_usage: v.cpuUsage,
                memory_usage: +((v.memoryUsed.usedMemMb * 100) / v.memoryUsed.totalMemMb).toFixed(2),
                shardCount: v.shards.length,
                clusterCount: v.clusters.length
            }
        }),
        shards: flatStats.map(v => {
            return {
                cluster_id: v.clusterId,
                guilds: v.guilds,
                users: v.users,
                cached_users: v.cachedUsers,
                channels: v.channels,
                latency: v.latency,
                uptime: v.uptime
            }
        }),
        players: lavaNodes,
        metrics
    }
}
