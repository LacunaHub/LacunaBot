import { Job, scheduleJob } from 'node-schedule'
import database from '../../database'
import logger from '../Logger'
import ShardingManager from '../utility/ShardingManager'

export default class DiamondGuild {
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
        this.schedule = scheduleJob(`DIAMOND-GUILD:${this.guild_id}`, this.expiration, () => this.expire())
        this.sharding.diamondGuilds.set(this.guild_id, this)
    }

    async expire() {
        await database.servers.updateOne(
            { _id: this.guild_id },
            {
                $set: {
                    'server.premium.available': false,
                    'server.premium.will_expire_on': 0
                }
            }
        )

        logger.info(`[DiamondGuild] Lacuna Diamond on guild ${this.guild_id} was expired`)
    }

    cancel() {
        this.schedule.cancel()
        this.sharding.diamondGuilds.delete(this.guild_id)
    }
}

export async function handleDiamondGuilds(sharding: ShardingManager) {
    const servers = await database.servers.find({ 'server.premium.available': true, 'server.premium.will_expire_on': { $gt: 0 } })

    for (const server of servers) {
        new DiamondGuild(sharding, server._id, server.server.premium.will_expire_on)
    }

    logger.log(`[DiamondGuild] Found ${servers.length} guilds with Lacuna Diamond`)
}
