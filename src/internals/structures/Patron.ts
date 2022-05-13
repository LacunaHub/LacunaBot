import { Job, scheduleJob } from 'node-schedule'
import database from '../../database'
import logger from '../Logger'
import discord from '../utility/DiscordUtils'
import ShardingManager from '../utility/ShardingManager'

export default class Patron {
    public sharding: ShardingManager
    public user_id: string
    public expiration: number
    public schedule: Job

    constructor(sharding: ShardingManager, user_id: string, expiration: number | Date) {
        this.sharding = sharding

        this.user_id = user_id

        this.expiration = expiration instanceof Date ? expiration.getTime() : expiration

        this.schedule = null
    }

    initialize() {
        this.schedule = scheduleJob(`PATRON:${this.user_id}`, this.expiration, () => this.expire())
        this.sharding.patrons.set(this.user_id, this)
    }

    async expire() {
        const support_server_id = '740586549145763960',
            active_patron_role_id = '968097093388468274'

        await database.users.updateOne({ _id: this.user_id }, { $set: { 'premium.available': false } })
        await discord.restApi.delete(discord.apiRoutes.guildMemberRole(support_server_id, this.user_id, active_patron_role_id)).catch(() => {})
    }

    cancel() {
        this.schedule.cancel()
        this.sharding.patrons.delete(this.user_id)
    }
}

export async function handlePatrons(sharding: ShardingManager) {
    const users = await database.users.find({ 'premium.available': true })

    for (const user of users) {
        new Patron(sharding, user._id, user.premium.expiration_timestamp)
    }

    logger.info(`(Utility): Found ${users.length} users with premium`)
}
