import Lacuna from '../Lacuna'
import { Job, scheduleJob } from 'node-schedule'
import { ServerDocument } from '../../database/schemas/Servers'
import { Guild } from 'discord.js'

export default class TemporaryBan {
    public self: Lacuna
    public user_id: string
    public guild_id: string
    public expires: Date
    public reason?: string
    public schedule: Job

    constructor(self: Lacuna, options: TemporaryBanOptions) {
        this.self = self

        this.user_id = options.user_id

        this.guild_id = options.guild_id

        this.expires = new Date(options.expires_timestamp)

        this.reason = options.reason ?? null

        this.schedule = null

        if (Date.now() >= this.expires.getTime() || this.expires.getTime() - Date.now() <= 30000) {
            this.unban()
            this.deleteEntry()

            return
        }

        if (options.initial) this.create()
        else this.createSchedule()
    }

    async create() {
        await this.ban()
        await this.createEntry()
        await this.createSchedule()
    }

    async createEntry() {
        await this.self.db.servers.updateOne({ _id: this.guild_id }, {
            $push: {
                'moderation.tempbans': {
                    user_id: this.user_id,
                    expires_timestamp: this.expires.getTime()
                }
            }
        })
    }

    async createSchedule() {
        this.schedule = scheduleJob(`${this.guild_id}:${this.user_id}`, this.expires, () => this.delete())
        this.self.tempbans.set(`${this.guild_id}:${this.user_id}`, this)
    }

    async ban() {
        const guild = this.self.guilds.cache.get(this.guild_id)

        if (guild && guild.available) {
            await guild.members.ban(this.user_id, { reason: this.reason }).catch(() => {})
        }
    }

    async delete() {
        await this.unban()
        await this.deleteEntry()
        this.schedule.cancel()
        this.self.tempbans.delete(`${this.guild_id}:${this.user_id}`)
    }

    async deleteEntry() {
        await this.self.db.servers.updateOne({ _id: this.guild_id }, {
            $pull: {
                'moderation.tempbans': {
                    user_id: this.user_id
                }
            }
        })
    }

    async unban() {
        const guild: Guild = this.self.guilds.cache.get(this.guild_id)

        if (guild && guild.available) {
            await guild.members.unban(this.user_id).catch(() => {})
        }
    }
}

export async function handleEntries(self: Lacuna): Promise<number> {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'moderation.tempbans.0': { $exists: true } })

    let entries = 0

    if (servers.length) {
        for (const server of servers) {
            const tempbans = server.moderation.tempbans

            for (const ban of tempbans) {
                new TemporaryBan(self, { user_id: ban.user_id, guild_id: server._id, expires_timestamp: ban.expires_timestamp })
            }

            entries += tempbans.length
        }
    }

    self.logger.log(`(Structures): Loaded ${entries} temporary bans from ${servers.length} servers`)

    return entries
}

export interface TemporaryBanOptions {
    user_id: string
    guild_id: string
    expires_timestamp: number
    reason?: string
    initial?: boolean
}