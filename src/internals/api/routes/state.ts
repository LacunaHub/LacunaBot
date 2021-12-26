import Router from '@koa/router'
import { Context } from 'koa'
import qdb from 'quick.db'
import nou from 'node-os-utils'
import numbro from 'numbro'
import { sharding } from '../../../index'

const { version } = require('../../../../package.json')

const router: Router = new Router({ prefix: '/state' })

router.get('/', getState)

async function getState(ctx: Context) {
    if (!sharding.shards.every(shard => shard.ready)) {
        ctx.status = 503; ctx.body = 'Service Unavailable'

        return
    }
    
    const guilds = await sharding.fetchClientValues('guilds.cache.size') as number[]
    const users = await sharding.broadcastEval(self => self.guilds.cache.reduce((x, y) => x + y.memberCount, 0))
    const cached_users = await sharding.fetchClientValues('users.cache.size') as number[]
    const channels = await sharding.fetchClientValues('channels.cache.size') as number[]
    const pings = await sharding.fetchClientValues('ws.ping') as number[]
    const uptimes = await sharding.fetchClientValues('uptime') as number[]
    const players = await sharding.shards.first().eval('this.playerNodesStats')
    const charts = qdb.get('charts')

    const cluster = {
        id: nou.os.hostname(),
        uptime: nou.os.uptime(),
        cpu: await nou.cpu.usage(),
        memory: await nou.mem.used()
    }

    const shards = sharding.shards.map(shard => {
        return {
            id: shard.id,
            cluster: cluster.id,
            latency: Math.round(pings[shard.id]),
            uptime: numbro(uptimes[shard.id] / 1000).format({ output: 'time' }),
            guilds: guilds[shard.id],
            users: users[shard.id],
            cached_users: cached_users[shard.id],
            channels: channels[shard.id]
        }
    })

    ctx.status = 200
    ctx.body = {
        version: version.split('.').slice(0, 2).join('.'),
        guilds: guilds.reduce((a, b) => a + b, 0),
        users: users.reduce((a, b) => a + b, 0),
        cached_users: cached_users.reduce((a, b) => a + b, 0),
        channels: channels.reduce((a, b) => a + b, 0),
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
        charts
    }
}

export default router