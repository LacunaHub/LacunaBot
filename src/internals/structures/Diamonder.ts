import Servers, { ServerDocument } from '../../database/schemas/Servers'
import { Job, scheduleJob } from 'node-schedule'
import logger from '../Logger'
import ShardingManager from '../utility/ShardingManager'

export default class Diamonder {
    public sharding: ShardingManager
    public guild_id: string
    public expiration: number
    public schedule: Job

    constructor(sharding: ShardingManager, guild_id: string, expiration: number) {
        this.sharding = sharding

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
        this.sharding.diamonded.set(this.guild_id, this)
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
}

export async function createDiamonders(sharding: ShardingManager) {
    const servers: ServerDocument[] = await Servers.find({ 'server.premium.available': true, 'server.premium.will_expire_on': { $gt: 0 } })

    for (const server of servers) {
        new Diamonder(sharding, server._id, server.server.premium.will_expire_on)

        logger.info(`(Diamonder): Guild ${server._id} added to schedule`)
    }
}