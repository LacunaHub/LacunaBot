import Router from '@koa/router'
import { Context } from 'koa'
import database from '../../../database'
import { bridgeClient, clusterManager } from '../../Cluster'
import Lacuna from '../../Lacuna'

const { version } = require('../../../../package.json')
const router: Router = new Router({ prefix: '/state' })

router.get('/', getState)

async function getState(ctx: Context) {
    const stats = await bridgeClient.broadcastEval((self: Lacuna) => {
        return {
            hostname: self.hostname,
            clusterId: self.cluster.id,
            guilds: self.guilds.cache.size,
            users: self.guilds.cache.reduce((x, y) => x + y.memberCount, 0),
            cachedUsers: self.users.cache.size,
            channels: self.channels.cache.size,
            latency: self.ws.ping,
            uptime: self.uptime
        }
    })
    const flatStats = stats.flat()

    const { data: servers } = await bridgeClient.request({ type: 'server-performance' }, { timeout: 15000, internal: false })
    const players = await [...clusterManager.clusters.values()][0].eval('this.getMusicNodes()')

    ctx.status = 200
    ctx.body = {
        version: version.split('.').slice(0, 2).join('.'),
        guilds: flatStats.reduce((a, b) => a + b.guilds, 0),
        users: flatStats.reduce((a, b) => a + b.users, 0),
        cached_users: flatStats.reduce((a, b) => a + b.cachedUsers, 0),
        channels: flatStats.reduce((a, b) => a + b.channels, 0),
        servers: servers.map((i: any) => {
            return {
                hostname: i.data.hostname,
                uptime: i.data.uptime,
                cpu_usage: i.data.cpuUsage,
                memory_usage: Number(((i.data.memoryUsed.usedMemMb * 100) / i.data.memoryUsed.totalMemMb).toFixed(2))
            }
        }),
        shards: flatStats.map(i => {
            return {
                hostname: i.hostname,
                cluster_id: i.clusterId,
                guilds: i.guilds,
                users: i.users,
                cached_users: i.cachedUsers,
                channels: i.channels,
                latency: i.latency,
                uptime: i.uptime
            }
        }),
        players: players,
        charts: await database.qdb.get('charts'),
        stats: await database.qdb.get('stats')
    }
}

export default router
