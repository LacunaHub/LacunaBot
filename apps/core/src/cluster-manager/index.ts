import Logger from '@/utility/Logger.js'
import { ClusterManager } from '@lacunahub/letsfrag'
import { join } from 'path'

const logger = Logger.child({ app: 'cluster-manager' })

const clusterManager = new ClusterManager(join(import.meta.dirname, '..', 'internals', 'Client.js'), {
    brokerClient: {
        redisURI: process.env.LCN_REDIS_URI!
    }
})

clusterManager.on('ready', () => logger.info('cluster manager ready'))
clusterManager.on('error', err => logger.error({ err }, 'cluster manager error'))
clusterManager.on('register', () => logger.info('cluster manager registration'))
clusterManager.on('clusterCreate', cluster =>
    logger.info({ id: cluster.id, shardList: cluster.shardList }, 'cluster creation')
)
clusterManager.on('clusterReady', cluster =>
    logger.info({ id: cluster.id, shardList: cluster.shardList }, 'cluster ready')
)
clusterManager.on('clusterDeath', cluster =>
    logger.warn({ id: cluster.id, shardList: cluster.shardList }, 'cluster death')
)
clusterManager.on('clusterTimeout', cluster =>
    logger.warn({ id: cluster.id, shardList: cluster.shardList }, 'cluster timeout')
)
clusterManager.on('clusterUnhealthy', cluster => logger.warn({ id: cluster.id }, 'unhealthy cluster'))

process.on('uncaughtException', logger.error.bind(logger))
process.on('unhandledRejection', logger.error.bind(logger))

clusterManager.register()
