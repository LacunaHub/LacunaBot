import { Database } from '@lacunahub/lacuna-database-driver'

export default new Database({
    uri: process.env.DB_URI,
    options: {
        dbName: 'lacuna',
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    qdb: {
        uri: process.env.DB_URI,
        options: {
            dbName: 'lacuna-qmongo',
            collectionName: 'internal-storage'
        }
    }
})
