import KeyvRedis from '@keyv/redis'
import { ClusterManager } from '@lacunahub/letsfrag'
import { mem } from 'node-os-utils'
import logger from './Logger'

const clusterCount = Math.round(mem.totalMem() / (1024 * 1024 * 1024))

const keyvRedis = new KeyvRedis(process.env.LCN_REDIS_URI)
const clusterManager = new ClusterManager(`${__dirname}/Client.js`, {
    server: {
        host: process.env.LCN_SERVER_HOST,
        port: +process.env.LCN_SERVER_PORT,
        authorization: process.env.LCN_SERVER_AUTHORIZATION,
        type: 'bot',
        reconnect: true,
        retries: 100
    },
    mode: 'fork',
    clusterCount: process.env.NODE_ENV === 'development' ? -1 : clusterCount,
    autoRespawn: true,
    spawnDelay: 10_000
})

clusterManager.on('clusterCreate', cluster => logger.info(`[ClusterManager] Cluster #${cluster.id} with shards (${cluster.shards}) has been created`))
clusterManager.on('ready', manager => logger.info(`[ClusterManager] Manager with clusters (${manager.clusters}) is ready`))

clusterManager.spawn()

export { clusterManager, keyvRedis }
