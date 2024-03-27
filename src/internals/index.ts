import { ClusterManager } from '@lacunahub/letsfrag'
import logger from './Logger'

const clusterManager = new ClusterManager(`${__dirname}/Client.js`, {
    server: {
        host: process.env.LCN_SERVER_HOST,
        port: +process.env.LCN_SERVER_PORT,
        authorization: process.env.LCN_SERVER_AUTHORIZATION,
        reconnect: true,
        retries: 100
    },
    mode: 'fork',
    autoRespawn: true,
    spawnDelay: 10_000
})

clusterManager.on('clusterCreate', cluster => logger.info(`[ClusterManager] Cluster #${cluster.id} has been created`))
clusterManager.on('ready', manager => logger.info(`[ClusterManager] Manager with clusters (${manager.clusters}) is ready`))

clusterManager.spawn()

export { clusterManager }
