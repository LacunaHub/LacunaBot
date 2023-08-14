import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { Database as QDatabase } from 'quickmongo'
import AutomationTasks from './schemas/AutomationTasks'
import Bills, { IBill } from './schemas/Bills'
import CustomCommands from './schemas/CustomCommands'
import Servers, { ServerDocument } from './schemas/Servers'
import TelegramSubs from './schemas/TelegramSubs'
import TwitchSubs, { ITwitchSub } from './schemas/TwitchSubs'
import Users from './schemas/Users'
import YouTubeSubs, { IYouTubeSub } from './schemas/YouTubeSubs'

// const [mysqlHost, mysqlPort, mysqlUser, mysqlPassword, mysqlDatabase] = process.env.DB_MYSQL_AUTH.split(':')
// const mysql = new MySQLDriver({
//     host: mysqlHost,
//     port: Number(mysqlPort),
//     user: mysqlUser,
//     password: mysqlPassword,
//     database: mysqlDatabase
// })

export default {
    automationTasks: AutomationTasks,

    bills: {
        async create(doc: IBill) {
            return await Bills.create(doc)
        },
        async deleteMany(filter: FilterQuery<IBill>, options?: QueryOptions) {
            return await Bills.deleteMany(filter, options)
        },
        async deleteOne(filter: FilterQuery<IBill>, options?: QueryOptions) {
            return await Bills.deleteOne(filter, options)
        },
        async find(filter: FilterQuery<IBill>) {
            return await Bills.find(filter)
        },
        async findOne(filter: FilterQuery<IBill>, projection?: any, options?: QueryOptions) {
            return await Bills.findOne(filter, projection, options)
        },
        async updateMany(filter: FilterQuery<IBill>, update?: UpdateQuery<IBill>, options?: QueryOptions) {
            return await Bills.updateMany(filter, update, options)
        },
        async updateOne(filter: FilterQuery<IBill>, update?: UpdateQuery<IBill>, options?: QueryOptions) {
            return await Bills.updateOne(filter, update, options)
        }
    },

    customCommands: CustomCommands,

    servers: {
        async create(doc: ServerDocument) {
            return await Servers.create(doc)
        },
        async deleteMany(filter: FilterQuery<ServerDocument>, options?: QueryOptions) {
            return await Servers.deleteMany(filter, options)
        },
        async deleteOne(filter: FilterQuery<ServerDocument>, options?: QueryOptions) {
            return await Servers.deleteOne(filter, options)
        },
        async fetch(filter: FilterQuery<ServerDocument>, defaultValues: Partial<ServerDocument> = {}) {
            let document = await Servers.findOne(filter)

            if (!document) {
                try {
                    document = await Servers.create({ ...filter, ...defaultValues })
                } catch (err) {
                    document = null
                }
            }

            return document
        },
        async find(filter: FilterQuery<ServerDocument>) {
            return await Servers.find(filter)
        },
        async findOne(filter: FilterQuery<ServerDocument>, projection?: any, options?: QueryOptions) {
            return await Servers.findOne(filter, projection, options)
        },
        async updateMany(filter: FilterQuery<ServerDocument>, update?: UpdateQuery<ServerDocument>, options?: QueryOptions) {
            return await Servers.updateMany(filter, update, options)
        },
        async updateOne(filter: FilterQuery<ServerDocument>, update?: UpdateQuery<ServerDocument>, options?: QueryOptions) {
            return await Servers.updateOne(filter, update, options)
        }
    },

    telegramSubs: TelegramSubs,

    twitchSubs: {
        async create(doc: ITwitchSub) {
            return await TwitchSubs.create(doc)
        },
        async deleteMany(filter: FilterQuery<ITwitchSub>, options?: QueryOptions) {
            return await TwitchSubs.deleteMany(filter, options)
        },
        async deleteOne(filter: FilterQuery<ITwitchSub>, options?: QueryOptions) {
            return await TwitchSubs.deleteOne(filter, options)
        },
        async find(filter: FilterQuery<ITwitchSub>) {
            return await TwitchSubs.find(filter)
        },
        async findOne(filter: FilterQuery<ITwitchSub>, projection?: any, options?: QueryOptions) {
            return await TwitchSubs.findOne(filter, projection, options)
        },
        async updateMany(filter: FilterQuery<ITwitchSub>, update?: UpdateQuery<ITwitchSub>, options?: QueryOptions) {
            return await TwitchSubs.updateMany(filter, update, options)
        },
        async updateOne(filter: FilterQuery<ITwitchSub>, update?: UpdateQuery<ITwitchSub>, options?: QueryOptions) {
            return await TwitchSubs.updateOne(filter, update, options)
        }
    },

    youtubeSubs: {
        async create(doc: IYouTubeSub) {
            return await YouTubeSubs.create(doc)
        },
        async deleteMany(filter: FilterQuery<IYouTubeSub>, options?: QueryOptions) {
            return await YouTubeSubs.deleteMany(filter, options)
        },
        async deleteOne(filter: FilterQuery<IYouTubeSub>, options?: QueryOptions) {
            return await YouTubeSubs.deleteOne(filter, options)
        },
        async find(filter: FilterQuery<IYouTubeSub>) {
            return await YouTubeSubs.find(filter)
        },
        async findOne(filter: FilterQuery<IYouTubeSub>, projection?: any, options?: QueryOptions) {
            return await YouTubeSubs.findOne(filter, projection, options)
        },
        async updateMany(filter: FilterQuery<IYouTubeSub>, update?: UpdateQuery<IYouTubeSub>, options?: QueryOptions) {
            return await YouTubeSubs.updateMany(filter, update, options)
        },
        async updateOne(filter: FilterQuery<IYouTubeSub>, update?: UpdateQuery<IYouTubeSub>, options?: QueryOptions) {
            return await YouTubeSubs.updateOne(filter, update, options)
        }
    },

    users: Users,

    json: {
        async get(): Promise<JsonData> {
            delete require.cache[require.resolve('../../data.json')]
            return require('../../data.json')
        }
    },

    qdb: new QDatabase(process.env.QMONGO_DB_URL, { collectionName: 'internal-storage' })
}

export interface JsonData {
    playableMusicHosts: string[]
    diamondPrices: Array<{
        months: number
        prices: { [key: string]: number }
        discounts: { [key: string]: number }
    }>
    allowedApiHosts: string[]
    allowedApiUrls: string[]
    rootUsers: string[]
}
