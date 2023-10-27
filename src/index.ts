import { configureEnvironments } from './internals/utility/Utils'

configureEnvironments()

import { Bridge } from 'discord-cross-hosting'
import { Server } from 'http'
import { connect } from 'mongoose'
import pm2 from 'pm2'
import database from './database'
import { bridgeClient, clusterManager } from './internals/Cluster'
import logger from './internals/Logger'
import { scheduleStatsCollect } from './internals/utility/Statistics'
import { hubRefreshSubscriptions } from './modules/YouTube'

let bridge: Bridge, server: Server
const isMasterBridge = process.env.DISCORD_CLIENT_BRIDGE_HOST === 'localhost'

if (isMasterBridge) {
    bridge = new Bridge({
        token: process.env.DISCORD_CLIENT_TOKEN,
        authToken: process.env.DISCORD_CLIENT_BRIDGE_AUTH_TOKEN,
        totalShards: Number(process.env.DISCORD_CLIENT_TOTAL_SHARDS),
        totalMachines: Number(process.env.DISCORD_CLIENT_TOTAL_MACHINES),
        shardsPerCluster: Number(process.env.DISCORD_CLIENT_SHARDS_PER_CLUSTER),
        port: Number(process.env.DISCORD_CLIENT_BRIDGE_PORT)
    })

    bridge.on('ready', url => {
        logger.info(`[Bridge] Bridge is ready on url ${url}`)

        pm2.start(
            {
                script: './dist/internals/api/index.js',
                name: 'api'
            },
            () => {}
        )

        setTimeout(startServices, 5000)
    })

    bridge.on('connect', client => logger.info(`[Bridge] Client "${client.id}" connected`))
    bridge.on('disconnect', client => logger.warn(`[Bridge] Client "${client.id}" disconnected`))
    bridge.on('clientRequest', async message => {
        if (!message._sCustom && !message._sRequest) return false

        if ((message as any).type === 'server-performance') {
            const servers = []

            for (const connection of bridge.connections) {
                if (connection['agent'] !== 'bot') continue

                try {
                    const response = await connection.request({ type: 'server-performance' }, 15000)

                    servers.push(response)
                } catch (err) {}
            }

            await message.reply({
                data: servers.sort((a, b) => a.clusterList[0] - b.clusterList[0])
            })
        }
    })

    bridge.start()
} else {
    startServices()
}

async function startServices() {
    await connect(process.env.DB_URI, { dbName: 'lacuna', useNewUrlParser: true, useUnifiedTopology: true })
    await database.qdb.connect()

    await bridgeClient.connect()
    bridgeClient.listen(clusterManager)

    try {
        const shardData = await bridgeClient.requestShardData()
        logger.log(`[BridgeClient] Shard data response`, JSON.stringify(shardData))

        if (!shardData || !shardData.shardList) throw new Error('Invalid "shardData"')

        clusterManager.totalShards = shardData.totalShards
        clusterManager.totalClusters = shardData.shardList.length
        clusterManager.shardList = shardData.shardList.flat()
        clusterManager.clusterList = shardData.clusterList

        await clusterManager.spawn({ timeout: -1, delay: 15000 })
    } catch (err) {
        logger.error('[BridgeClient]', err)
    }

    if (isMasterBridge) {
        scheduleStatsCollect()
        hubRefreshSubscriptions()
    }
}

process.on('uncaughtException', logger.error)
process.on('unhandledRejection', logger.error)

export default { server, bridge }
