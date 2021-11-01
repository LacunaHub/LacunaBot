const { Router } = require('express')
const ShardingManager = require('../../utility/ShardingManager')
const nou = require('node-os-utils')
const numbro = require('numbro')
const { version } = require('../../../package.json')

const router = Router()
const qdb = require('quick.db')

router.get('/summary', async (req, res) => {
    const guilds = await ShardingManager.fetchClientValues('guilds.cache.size')
    const users = await ShardingManager.fetchClientValues('users.cache.size')
    const channels = await ShardingManager.fetchClientValues('channels.cache.size')
    const pings = await ShardingManager.fetchClientValues('ws.ping')
    const uptimes = await ShardingManager.fetchClientValues('uptime')
    const players = await ShardingManager.shards.first().eval('this.playerNodesStats')
    const charts = qdb.get('charts')

    const cluster = {
        id: nou.os.hostname(),
        uptime: nou.os.uptime(),
        cpu: await nou.cpu.usage(),
        memory: await nou.mem.used()
    }

    const shards = ShardingManager.shards.map(shard => {
        return {
            id: shard.id,
            cluster: cluster.id,
            latency: Math.round(pings[shard.id]),
            uptime: numbro(uptimes[shard.id] / 1000).format({ output: 'time' }),
            guilds: guilds[shard.id],
            users: users[shard.id],
            channels: channels[shard.id]
        }
    })

    await res.status(200).json({
        version: version,
        guilds: guilds.reduce((a, b) => a + b, 0),
        users: users.reduce((a, b) => a + b, 0),
        channels: channels.reduce((a, b) => a + b, 0),
        shards: shards,
        players: players,
        clusters: [
            {
                id: cluster.id,
                uptime: numbro(cluster.uptime).format({ output: 'time' }),
                cpu_usage: cluster.cpu,
                memory_usage: Number(((cluster.memory.usedMemMb * 100) / cluster.memory.totalMemMb).toFixed(2)),
                drive_usage: cluster.drive ? cluster.drive.usedPercentage : 0
            }
        ],
        charts
    })
})

module.exports = router