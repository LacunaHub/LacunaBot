import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import ServerActivities, { ServerActivitiesDocument } from './schemas/ServerActivities'
import Servers, { ServerDocument } from './schemas/Servers'
import Users, { UserDocument } from './schemas/Users'

export default {
    activities: {
        async create(doc: ServerActivitiesDocument) {
            return await ServerActivities.create(doc)
        },
        async deleteMany(filter: FilterQuery<ServerActivitiesDocument>, options?: QueryOptions) {
            return await ServerActivities.deleteMany(filter, options)
        },
        async deleteOne(filter: FilterQuery<ServerActivitiesDocument>, options?: QueryOptions) {
            return await ServerActivities.deleteOne(filter, options)
        },
        async fetch(filter: FilterQuery<ServerActivitiesDocument>) {
            let document = await ServerActivities.findOne(filter)

            if (!document) {
                try {
                    document = await ServerActivities.create(filter as any)
                } catch (err) {
                    document = null
                }
            }

            return document
        },
        async find(filter: FilterQuery<ServerActivitiesDocument>) {
            return await ServerActivities.find(filter)
        },
        async findOne(filter: FilterQuery<ServerActivitiesDocument>, projection?: any, options?: QueryOptions) {
            return await ServerActivities.findOne(filter, projection, options)
        },
        async updateMany(filter: FilterQuery<ServerActivitiesDocument>, update?: UpdateQuery<ServerActivitiesDocument>, options?: QueryOptions) {
            return await ServerActivities.updateMany(filter, update, options)
        },
        async updateOne(filter: FilterQuery<ServerActivitiesDocument>, update?: UpdateQuery<ServerActivitiesDocument>, options?: QueryOptions) {
            return await ServerActivities.updateOne(filter, update, options)
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
}