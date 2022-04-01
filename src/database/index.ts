import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import Activities, { IActivities } from './schemas/Activities'
import Servers, { ServerDocument } from './schemas/Servers'
import TwitchSubs, { ITwitchSub } from './schemas/TwitchSubs'
import Users, { UserDocument } from './schemas/Users'
import YouTubeSubs, { IYouTubeSub } from './schemas/YouTubeSubs'

export default {
    activities: {
        async create(doc: IActivities) {
            return await Activities.create(doc)
        },
        async deleteMany(filter: FilterQuery<IActivities>, options?: QueryOptions) {
            return await Activities.deleteMany(filter, options)
        },
        async deleteOne(filter: FilterQuery<IActivities>, options?: QueryOptions) {
            return await Activities.deleteOne(filter, options)
        },
        async fetch(filter: FilterQuery<IActivities>) {
            let document = await Activities.findOne(filter)

            if (!document) {
                try {
                    document = await Activities.create(filter as any)
                } catch (err) {
                    document = null
                }
            }

            return document
        },
        async find(filter: FilterQuery<IActivities>) {
            return await Activities.find(filter)
        },
        async findOne(filter: FilterQuery<IActivities>, projection?: any, options?: QueryOptions) {
            return await Activities.findOne(filter, projection, options)
        },
        async updateMany(filter: FilterQuery<IActivities>, update?: UpdateQuery<IActivities>, options?: QueryOptions) {
            return await Activities.updateMany(filter, update, options)
        },
        async updateOne(filter: FilterQuery<IActivities>, update?: UpdateQuery<IActivities>, options?: QueryOptions) {
            return await Activities.updateOne(filter, update, options)
        }
    },

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
        async fetch(filter: FilterQuery<ServerDocument>) {
            let document = await Servers.findOne(filter)

            if (!document) {
                try {
                    document = await Servers.create(filter as any)
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

    users: {
        async create(doc: UserDocument) {
            return await Users.create(doc)
        },
        async deleteMany(filter: FilterQuery<UserDocument>, options?: QueryOptions) {
            return await Users.deleteMany(filter, options)
        },
        async deleteOne(filter: FilterQuery<UserDocument>, options?: QueryOptions) {
            return await Users.deleteOne(filter, options)
        },
        async fetch(filter: FilterQuery<UserDocument>) {
            let document = await Users.findOne(filter)

            if (!document) {
                try {
                    document = await Users.create(filter as any)
                } catch (err) {
                    document = null
                }
            }

            return document
        },
        async find(filter: FilterQuery<UserDocument>) {
            return await Users.find(filter)
        },
        async findOne(filter: FilterQuery<UserDocument>, projection?: any, options?: QueryOptions) {
            return await Users.findOne(filter, projection, options)
        },
        async updateMany(filter: FilterQuery<UserDocument>, update?: UpdateQuery<UserDocument>, options?: QueryOptions) {
            return await Users.updateMany(filter, update, options)
        },
        async updateOne(filter: FilterQuery<UserDocument>, update?: UpdateQuery<UserDocument>, options?: QueryOptions) {
            return await Users.updateOne(filter, update, options)
        }
    },

    json: {
        async get(): Promise<JsonData> {
            delete require.cache[require.resolve('../../data.json')]
            return require('../../data.json')
        }
    }
}

export interface JsonData {
    playableMusicHosts: string[]
    diamondPrices: Array<{ months: number, price: number, discount: number }>
    allowedApiHosts: string[]
    allowedApiUrls: string[]
    rootUsers: string[]
}