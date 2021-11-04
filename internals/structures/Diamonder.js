const Servers = require('../../database/schemas/Servers')
const { scheduleJob } = require('node-schedule')
const logger = require('../Logger')

class Diamonder {
    /**
     * @param {string} guild_id
     * @param {number} expiration
     */
    constructor(guild_id, expiration) {
        this.guild_id = guild_id

        this.expiration = expiration

        this.schedule = null

        if (Date.now() >= this.expiration || this.expiration - Date.now() <= 30000) {
            this.expire()

            return
        }

        this.initialize()
    }

    initialize() {
        this.schedule = scheduleJob(`${this.guild_id}:${this.expiration}`, this.expiration, () => this.expire())
        logger.telegram.info(`(Diamonder): Guild ${this.guild_id} received a Diamond subscription`)
    }

    async expire() {
        await Servers.updateOne({ _id: this.guild_id }, {
            $set: {
                'server.premium.available': false,
                'server.premium.will_expire_on': 0
            }
        })

        logger.telegram.info(`(Diamonder): Diamond on guild ${this.guild_id} was expired`)
    }

    static async scheduleDiamonded() {
        const servers = await Servers.find({ 'server.premium.available': true, 'server.premium.will_expire_on': { $gt: 0 } })

        for (const server of servers) {
            new this(server._id, server.server.premium.will_expire_on)

            logger.info(`(Diamonder): Guild ${server._id} added to schedule`)
        }
    }
}

module.exports = Diamonder