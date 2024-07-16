import KeyvRedis from '@keyv/redis'
import { Database } from '@lacunahub/lacuna-database-driver'

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

export const redis = new KeyvRedis(process.env.LCN_REDIS_URI)
