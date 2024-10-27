import { Database } from '@lacunahub/lacuna-database-driver'
import { RedisStoreAdapter } from '@lacunahub/letsfrag'

export default new Database({
    uri: process.env.LCN_DB_URI,
    options: {
        dbName: 'lacuna',
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    qdb: {
        uri: process.env.LCN_DB_URI,
        options: {
            dbName: 'lcnqm',
            collectionName: 'internal-storage'
        }
    }
})

export const redisStore = new RedisStoreAdapter(process.env.LCN_REDIS_URI).setMaxListeners(0)
