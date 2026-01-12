import Logger from '@/utility/Logger'
import { ClusterManager } from '@lacunahub/letsfrag'
import { mem } from 'node-os-utils'
import { join } from 'path'

const logger = Logger.child({ app: 'cluster-manager' })
const clusterCount = Math.round(mem.totalMem() / (1024 * 1024 * 1024))

const clusterManager = new ClusterManager(join(__dirname, '..', 'internals', 'Client.js'), {
    brokerClient: {
        type: 'bot',
        redis: process.env.LCN_REDIS_URI
    },
    mode: 'fork',
    clusterCount: process.env.NODE_ENV === 'development' ? -1 : clusterCount,
    autoRespawn: true,
    spawnDelay: 10_000
})

clusterManager.on('clusterCreate', cluster => logger.info({ clusterId: cluster.id, clusterShards: cluster.shards }, 'cluster create'))
clusterManager.on('ready', manager => logger.info({ clusters: manager.clusters, shards: manager.shards }, 'cluster manager ready'))

process.on('uncaughtException', logger.error.bind(logger))
process.on('unhandledRejection', logger.error.bind(logger))

clusterManager.spawn()
