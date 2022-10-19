import { Client as BridgeClient } from 'discord-cross-hosting'
import { Manager as ClusterManager } from 'discord-hybrid-sharding'
import logger from './Logger'

const bridgeClient = new BridgeClient({
    host: process.env.CLIENT_BRIDGE_HOST,
    port: Number(process.env.CLIENT_BRIDGE_PORT),
    authToken: process.env.CLIENT_BRIDGE_AUTH_TOKEN,
    agent: 'bot',
    retries: 360,
    rollingRestarts: false
})

bridgeClient.on('ready', () => logger.info('(Bridge Client) Client is ready'))

const clusterManager = new ClusterManager(`${__dirname}/Client.js`, {
    token: process.env.CLIENT_TOKEN,
    shardsPerClusters: Number(process.env.CLIENT_SHARDS_PER_CLUSTER)
})

clusterManager.on('clusterCreate', cluster => logger.info(`(Cluster Manager) Cluster #${cluster.id} has been created`))

export { bridgeClient, clusterManager }
