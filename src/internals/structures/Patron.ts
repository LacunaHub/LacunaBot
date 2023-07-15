import { Job, scheduleJob } from 'node-schedule'
import database from '../../database'
import logger from '../Logger'
import { active_patron_role_id, support_server_id } from '../utility/BillUtils'
import discord from '../utility/DiscordUtils'

export const patrons = new Map<string, Patron>()

export default class Patron {
    public user_id: string
    public expiration: number
    public schedule: Job

    constructor(user_id: string, expiration: number | Date) {
        this.user_id = user_id

        this.expiration = expiration instanceof Date ? expiration.getTime() : expiration

        this.schedule = null

        if (Date.now() >= this.expiration || this.expiration - Date.now() <= 30000) {
            this.expire()

            return
        }

        this.initialize()
    }

    initialize() {
        this.schedule = scheduleJob(`PATRON:${this.user_id}`, this.expiration, () => this.expire())
        patrons.set(this.user_id, this)
    }

    async expire() {
        try {
            await database.users.updateOne({ _id: this.user_id }, { $set: { 'premium.available': false } })
            await discord.restApi.delete(discord.apiRoutes.guildMemberRole(support_server_id, this.user_id, active_patron_role_id))
        } catch (err) {}
    }

    cancel() {
        this.schedule.cancel()
        patrons.delete(this.user_id)
    }
}

export async function handlePatrons() {
    const users = await database.users.find({ 'premium.available': true })

    for (const user of users) {
        new Patron(user._id, user.premium.expiration_timestamp)
    }

    logger.log(`[Patron] Found ${users.length} users with premium`)
}
