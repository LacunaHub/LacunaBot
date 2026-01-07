import database from '@/database'
import { Job, scheduleJob } from 'node-schedule'
import Logger from '../../../../internals/Logger'
import { activePatronRoleId, supportServerId } from '../../../../internals/utility/Constants'
import DiscordUtils from '../../../utility/DiscordUtils'

export const patrons = new Map<string, Patron>()

export class Patron {
    public userId: string
    public expiresAt: number
    public schedule: Job

    constructor(userId: string, expiresAt: number | Date) {
        this.userId = userId

        this.expiresAt = expiresAt instanceof Date ? expiresAt.getTime() : expiresAt

        this.schedule = null

        if (Date.now() >= this.expiresAt || this.expiresAt - Date.now() <= 30000) {
            this.expire()

            return
        }

        this.initialize()
    }

    initialize() {
        this.schedule = scheduleJob(`PATRON:${this.userId}`, this.expiresAt, this.expire.bind(this))
        patrons.set(this.userId, this)
    }

    async expire() {
        try {
            await database.users.updateOne({ _id: this.userId }, { $set: { 'premium.available': false } })
            await DiscordUtils.rest.delete(DiscordUtils.restRoutes.guildMemberRole(supportServerId, this.userId, activePatronRoleId))
        } catch (err) {
            await Logger.handleError({ module: 'Patron', action: 'ExpirePatronage', error: err })
        }
    }

    cancel() {
        this.schedule.cancel()
        patrons.delete(this.userId)
    }
}

export async function handlePatrons() {
    const users = await database.users.find({ 'premium.available': true })

    for (const user of users) {
        new Patron(user._id, user.premium.expiration_timestamp)
    }

    Logger.log(`[Patron] Found ${users.length} users with premium`)
}
