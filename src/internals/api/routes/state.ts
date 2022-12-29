import Router from '@koa/router'
import { Context } from 'koa'
import nou from 'node-os-utils'
import numbro from 'numbro'
import qdb from 'quick.db'
import { clusterManager } from '../../Cluster'
import Lacuna from '../../Lacuna'

const { version } = require('../../../../package.json')
const router: Router = new Router({ prefix: '/state' })

router.get('/', getState)

async function getState(ctx: Context) {
    if (![...clusterManager.clusters.values()].every(cluster => cluster.ready)) ctx.throw(503)

    const stats = await clusterManager.broadcastEval((self: Lacuna) => {
        return {
            guilds: self.guilds.cache.size,
            users: self.guilds.cache.reduce((x, y) => x + y.memberCount, 0),
            cachedUsers: self.users.cache.size,
            channels: self.channels.cache.size,
            latency: self.ws.ping,
            uptime: self.uptime
        }
    })

    const players = await [...clusterManager.clusters.values()][0].eval('this.playerNodesStats')
    const cluster = {
        id: nou.os.hostname(),
        uptime: nou.os.uptime(),
        cpu: await nou.cpu.usage(),
        memory: await nou.mem.used()
    }

    const shards = [...clusterManager.clusters.values()].map(cluster => {
        const clusterStats = stats[cluster.id]

        return {
            id: cluster.id,
            guilds: clusterStats.guilds,
            users: clusterStats.users,
            cached_users: clusterStats.cachedUsers,
            channels: clusterStats.channels,
            latency: Math.round(clusterStats.latency),
            uptime: numbro(clusterStats.uptime / 1000).format({ output: 'time' })
        }
    })

    ctx.status = 200
    ctx.body = {
        version: version.split('.').slice(0, 2).join('.'),
        guilds: stats.reduce((a, b) => a + b.guilds, 0),
        users: stats.reduce((a, b) => a + b.users, 0),
        cached_users: stats.reduce((a, b) => a + b.cachedUsers, 0),
        channels: stats.reduce((a, b) => a + b.channels, 0),
        shards: shards,
        players: players,
        clusters: [
            {
                id: cluster.id,
                uptime: numbro(cluster.uptime).format({ output: 'time' }),
                cpu_usage: cluster.cpu,
                memory_usage: Number(((cluster.memory.usedMemMb * 100) / cluster.memory.totalMemMb).toFixed(2))
            }
        ],
        charts: qdb.get('charts'),
        stats: qdb.get('stats')
    }
}

export default router
