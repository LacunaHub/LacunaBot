const Servers = require('./schemas/Servers')
const Users = require('./schemas/Users')

const logger = require('../internals/Logger')

class Manager {
    /**
     * @param {import('mongoose').Model} schema
     * @param {*} options
     */
    static async create(schema, options) {
        try {
            await schema.create(options)
    
            return true
        } catch (err) {
            await logger.error(err)

            return false
        }
    }

    /**
     * @param {import('mongoose').Model} schema
     * @param {*} options
     */
    static async find(schema, options) {
        try {
            return await schema.findOne(options)
        } catch(err) {
            await logger.error(err)

            return false
        }
    }

    /**
     * @param {import('mongoose').Model} schema
     * @param {*} options
     */
    static async findSome(schema, options) {
        try {
            return await schema.find(options)
        } catch (err) {
            await logger.error(err)

            return false
        }
    }

    /**
     * @param {import('mongoose').Model} schema
     * @param {*} options
     */
    static async fetch(schema, options) {
        let doc = await Manager.find(schema, options)

        if (doc) return doc

        try {
            await Manager.create(schema, options)

            doc = await Manager.find(schema, options)

            return doc
        } catch (err) {
            await logger.error(err)

            return false
        }
    }

    /**
     * @param {import('mongoose').Model} schema
     * @param {*} findOptions
     * @param {*} updateOptions
     */
    static async update(schema, findOptions, updateOptions) {
        try {
            await schema.updateOne(findOptions, updateOptions)

            return true
        } catch (err) {
            await logger.error(err)

            return false
        }
    }

    /**
     * @param {import('mongoose').Model} schema
     * @param {*} updateOptions
     */
    static async updateSome(schema, findOptions, updateOptions) {
        try {
            await schema.updateMany(findOptions, updateOptions)

            return true
        } catch (err) {
            await logger.error(err)

            return false
        }
    }

    /**
     * @param {import('mongoose').Model} schema
     * @param {*} options
     */
    static async delete(schema, options) {
        try {
            await schema.deleteOne(options)

            return true
        } catch (err) {
            await logger.error(err)

            return false
        }
    }

    /**
     * @param {import('mongoose').Model} schema
     * @param {*} options
     */
    static async deleteSome(schema, options) {
        try {
            await schema.deleteMany(options)

            return true
        } catch (err) {
            await logger.error(err)

            return false
        }
    }
}

class ServersManager {
    /**
     * @param {import('../internals/Typings').ServerDocument} options
     */
    static async create(options) {
        return await Manager.create(Servers, options)
    }

    /**
     * @param {import('../internals/Typings').ServerDocument} options
     * @returns {import('../internals/Typings').ServerDocument}
     */
    static async find(options) {
        return await Manager.find(Servers, options)
    }

    /**
     * @param {import('../internals/Typings').ServerDocument} options
     * @returns {import('../internals/Typings').ServerDocument[]}
     */
    static async findSome(options) {
        return await Manager.findSome(Servers, options)
    }

    /**
     * @param {import('../internals/Typings').ServerDocument} options
     * @returns {import('../internals/Typings').ServerDocument}
     */
    static async fetch(options) {
        return await Manager.fetch(Servers, options)
    }

    /**
     * @param {import('../internals/Typings').ServerDocument} findOptions
     * @param {*} updateOptions
     */
    static async update(findOptions, updateOptions) {
        return await Manager.update(Servers, findOptions, updateOptions)
    }

    /**
     * @param {import('../internals/Typings').ServerDocument} findOptions
     * @param {*} updateOptions
     */
    static async updateSome(findOptions, updateOptions) {
        return await Manager.updateSome(Servers, findOptions, updateOptions)
    }

    /**
     * @param {import('../internals/Typings').ServerDocument} options
     */
    static async delete(options) {
        return await Manager.delete(Servers, options)
    }

    /**
     * @param {import('../internals/Typings').ServerDocument} options
     */
    static async deleteSome(options) {
        return await Manager.deleteSome(options)
    }
}

class UsersManager {
    /**
     * @param {import('../internals/Typings').UserDocument} options
     */
    static async create(options) {
        return await Manager.create(Users, options)
    }

    /**
     * @param {import('../internals/Typings').UserDocument} options
     * @returns {import('../internals/Typings').UserDocument}
     */
    static async find(options) {
        return await Manager.find(Users, options)
    }

    /**
     * @param {import('../internals/Typings').UserDocument} options
     * @returns {import('../internals/Typings').UserDocument[]}
     */
    static async findSome(options) {
        return await Manager.findSome(Users, options)
    }

    /**
     * @param {import('../internals/Typings').UserDocument} options
     * @returns {import('../internals/Typings').UserDocument}
     */
    static async fetch(options) {
        return await Manager.fetch(Users, options)
    }

    /**
     * @param {import('../internals/Typings').UserDocument} findOptions
     * @param {*} updateOptions
     */
    static async update(findOptions, updateOptions) {
        return await Manager.update(Users, findOptions, updateOptions)
    }

    /**
     * @param {import('../internals/Typings').UserDocument} findOptions
     * @param {*} updateOptions
     */
    static async updateSome(findOptions, updateOptions) {
        return await Manager.updateSome(Users, findOptions, updateOptions)
    }

    /**
     * @param {import('../internals/Typings').UserDocument} options
     */
    static async delete(options) {
        return await Manager.delete(Users, options)
    }

    /**
     * @param {import('../internals/Typings').UserDocument} options
     */
    static async deleteSome(options) {
        return await Manager.deleteSome(options)
    }
}

module.exports.servers = ServersManager

module.exports.users = UsersManager