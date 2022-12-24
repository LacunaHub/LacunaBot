import { Client as BridgeClient } from 'discord-cross-hosting'
import { HeartbeatManager, Manager as ClusterManager } from 'discord-hybrid-sharding'
import logger from './Logger'

const bridgeClient = new BridgeClient({
    host: process.env.DISCORD_CLIENT_BRIDGE_HOST,
    port: Number(process.env.DISCORD_CLIENT_BRIDGE_PORT),
    authToken: process.env.DISCORD_CLIENT_BRIDGE_AUTH_TOKEN,
    agent: 'bot',
    retries: 360,
    rollingRestarts: false
})

bridgeClient.on('ready', () => logger.info('[BridgeClient] Client is ready'))

const clusterManager = new ClusterManager(`${__dirname}/Client.js`, {
    token: process.env.DISCORD_CLIENT_TOKEN,
    shardsPerClusters: Number(process.env.DISCORD_CLIENT_SHARDS_PER_CLUSTER),
    restarts: {
        max: 5,
        interval: 3_600_000
    }
})

clusterManager.extend(
    new HeartbeatManager({
        interval: 2000,
        maxMissedHeartbeats: 10
    })
)

clusterManager.on('clusterCreate', cluster => logger.info(`[ClusterManager] Cluster #${cluster.id} has been created`))

export { bridgeClient, clusterManager }
