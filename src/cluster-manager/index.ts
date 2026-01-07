import Logger from '@/utility/Logger'
import { ClusterManager } from '@lacunahub/letsfrag'
import { mem } from 'node-os-utils'
import { join } from 'path'

const logger = Logger.child({ app: 'cluster-manager' })
const clusterCount = Math.round(mem.totalMem() / (1024 * 1024 * 1024))

const clusterManager = new ClusterManager(join(__dirname, '..', 'internals', 'Client.js'), {
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

clusterManager.on('clusterCreate', cluster => logger.info({ clusterId: cluster.id, clusterShards: cluster.shards }, 'cluster create'))
clusterManager.on('ready', manager => logger.info({ clusters: manager.clusters, shards: manager.shards }, 'cluster manager ready'))

clusterManager.spawn()
