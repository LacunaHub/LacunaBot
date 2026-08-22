import mongoose from 'mongoose'
import { Database as QDatabase, type QuickMongoOptions } from 'quickmongo'
import Payments from './schemas/Payments.js'
import Reports from './schemas/Reports.js'
import ServerBans from './schemas/ServerBans.js'
import Servers from './schemas/Servers.js'
import Subscriptions from './schemas/Subscriptions.js'
import TelegramSubs from './schemas/TelegramSubs.js'
import TwitchSubs from './schemas/TwitchSubs.js'
import Users from './schemas/Users.js'
import ViolativeMessages from './schemas/ViolativeMessages.js'
import YouTubeSubs from './schemas/YouTubeSubs.js'

class Database {
    public db!: typeof mongoose
    public qdb!: QDatabase

    public payments = Payments
    public reports = Reports
    public serverBans = ServerBans
    public servers = Servers
    public subscriptions = Subscriptions
    public telegramSubs = TelegramSubs
    public twitchSubs = TwitchSubs
    public users = Users
    public violativeMessages = ViolativeMessages
    public youtubeSubs = YouTubeSubs

    constructor(public options: DatabaseOptions) {}

    public async connect(): Promise<this> {
        this.db = (await mongoose.connect(this.options.uri, this.options.options)) as any
        this.qdb = new QDatabase(this.options.qdb.uri, this.options.qdb.options)
        this.qdb.connect()

        return this
    }

    public async getRootUsers(): Promise<string[]> {
        let rootUsers: string[] = await this.qdb.get('rootUsers')

        if (!rootUsers) {
            rootUsers = ['258317078560243712']

            await this.qdb.set('rootUsers', rootUsers)
        }

        return rootUsers
    }

    public async getBlockedUsers(): Promise<string[]> {
        let blockedUsers: string[] = await this.qdb.get('blockedUsers')

        if (!blockedUsers) {
            blockedUsers = []

            await this.qdb.set('blockedUsers', blockedUsers)
        }

        return blockedUsers
    }

    public async getEnv(): Promise<EnvData> {
        let env: EnvData = await this.qdb.get('env')

        if (!env) {
            env = {}

            await this.qdb.set('env', env)
        }

        return env
    }

    public async getInternalData(): Promise<InternalData> {
        const rootUsers = await this.getRootUsers(),
            blockedUsers = await this.getBlockedUsers(),
            env = await this.getEnv()
        const allowedAPIReferrers: string[] = (await this.qdb.get('allowedAPIReferrers')) || [],
            publicAPIPaths: string[] = (await this.qdb.get('publicAPIPaths')) || [],
            allowedImageHosts: string[] = (await this.qdb.get('allowedImageHosts')) || [],
            allowedMusicHosts: string[] = (await this.qdb.get('allowedMusicHosts')) || []

        return {
            rootUsers,
            blockedUsers,
            env,
            allowedAPIReferrers,
            publicAPIPaths,
            allowedImageHosts,
            allowedMusicHosts
        }
    }
}

export default new Database({
    uri: process.env.LCN_DB_URI!,
    options: {
        dbName: 'lacuna'
    },
    qdb: {
        uri: process.env.LCN_DB_URI!,
        options: {
            dbName: 'lcnqm',
            collectionName: 'internal-storage'
        }
    }
})

export interface DatabaseOptions {
    uri: string
    options: mongoose.ConnectOptions
    qdb: {
        uri: string
        options: QuickMongoOptions
    }
}

export interface InternalData {
    rootUsers: string[]
    blockedUsers: string[]
    env: EnvData
    allowedAPIReferrers: string[]
    publicAPIPaths: string[]
    allowedImageHosts: string[]
    allowedMusicHosts: string[]
}

export interface EnvData {
    [key: string]: any
    aiClosedBetaServerIds?: string[]
    aiModDisabled?: boolean
    aiModSystemInstruction?: string
    aiModPoolTTL?: number
    aiModPoolMaxMessages?: number
}
