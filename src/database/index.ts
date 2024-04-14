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
