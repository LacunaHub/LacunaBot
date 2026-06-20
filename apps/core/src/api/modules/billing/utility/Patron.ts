import DiscordUtils from '@/api/utility/DiscordUtils.js'
import Logger from '@/api/utility/Logger.js'
import database from '@/database/index.js'
import { activePatronRoleId, supportServerId } from '@/internals/utility/Constants.js'
import { Job, scheduleJob } from 'node-schedule'

export const patrons = new Map<string, Patron>()

export class Patron {
    public userId: string
    public expiresAt: number
    public schedule: Job | null

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
            await DiscordUtils.rest.delete(
                DiscordUtils.restRoutes.guildMemberRole(supportServerId, this.userId, activePatronRoleId)
            )
        } catch (err) {
            Logger.error({ module: 'Patron', action: 'ExpirePatronage', err })
        }
    }

    cancel() {
        this.schedule!.cancel()
        patrons.delete(this.userId)
    }
}

export async function handlePatrons() {
    const users = await database.users.find({ 'premium.available': true }).lean()

    for (const user of users) {
        new Patron(user._id, user.premium.expiration_timestamp)
    }

    Logger.info({ count: users.length }, 'users with patronage loaded')
}
