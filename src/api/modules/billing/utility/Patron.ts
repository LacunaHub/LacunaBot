import { Job, scheduleJob } from 'node-schedule'
import database from '../../../../database'
import Logger from '../../../../internals/Logger'
import { activePatronRoleId, formerPatronRoleId, supportServerId } from '../../../../internals/utility/Constants'
import DiscordUtils from '../../../utility/DiscordUtils'

export const patrons = new Map<string, Patron>()

export class Patron {
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
            await DiscordUtils.rest.delete(DiscordUtils.restRoutes.guildMemberRole(supportServerId, this.user_id, activePatronRoleId))
            await DiscordUtils.rest.put(DiscordUtils.restRoutes.guildMemberRole(supportServerId, this.user_id, formerPatronRoleId))
        } catch (err) {
            await Logger.handleError({ module: 'Patron', action: 'ExpirePatronage', error: err })
        }
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

    Logger.log(`[Patron] Found ${users.length} users with premium`)
}
