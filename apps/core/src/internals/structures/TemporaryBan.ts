import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { Job, scheduleJob } from 'node-schedule'

export default class TemporaryBan {
    public self: Lacuna
    public userId: string
    public guildId: string
    public expiresAt: Date
    public reason: string | null
    public schedule: Job | null

    constructor(self: Lacuna, options: TemporaryBanOptions) {
        this.self = self

        this.userId = options.user_id

        this.guildId = options.guild_id

        this.expiresAt = new Date(options.expires_timestamp)

        this.reason = options.reason ?? null

        this.schedule = null

        const expired = Date.now() >= this.expiresAt.getTime() || this.expiresAt.getTime() - Date.now() <= 50000

        if (expired) {
            this.delete()
        } else {
            this.create(Boolean(options.initial))
        }
    }

    async create(initial: boolean = true) {
        this.schedule = scheduleJob(`BAN:${this.guildId}:${this.userId}`, this.expiresAt, () => this.delete())
        this.self.tempbans.set(`${this.guildId}:${this.userId}`, this)

        if (initial) {
            await this.createBan()
            await this.self.db.servers.updateOne(
                { _id: this.guildId },
                {
                    $push: {
                        'moderation.tempbans': {
                            user_id: this.userId,
                            expires_timestamp: this.expiresAt.getTime()
                        }
                    }
                }
            )
        }
    }

    async delete(scheduled: boolean = true, reason?: string) {
        if (!scheduled) this.schedule!.cancel()

        await this.self.db.servers.updateOne(
            { _id: this.guildId },
            {
                $pull: {
                    'moderation.tempbans': {
                        user_id: this.userId
                    }
                }
            }
        )

        await this.removeBan(reason)
        this.self.tempbans.delete(`${this.guildId}:${this.userId}`)
    }

    async createBan() {
        try {
            const guild = this.self.guilds.cache.get(this.guildId)

            if (guild) {
                return await guild.bans.create(this.userId, { reason: this.reason! })
            }
        } catch (err) {
            this.self.logger.error({ module: 'TemporaryBan', action: 'CreateBan', err, guildId: this.guildId })
        }
    }

    async removeBan(reason?: string) {
        try {
            const guild = this.self.guilds.cache.get(this.guildId)

            if (guild) {
                return await guild.bans.remove(this.userId, reason)
            }
        } catch (err) {
            this.self.logger.error({ module: 'TemporaryBan', action: 'RemoveBan', err, guildId: this.guildId })
        }
    }
}

export async function handleEntries(self: Lacuna): Promise<number> {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({
        _id: { $in: guilds },
        'moderation.tempbans.0': { $exists: true }
    })
    let handledEntries = 0

    for (const server of servers) {
        const tempbans = server.moderation.tempbans

        for (const ban of tempbans) {
            new TemporaryBan(self, {
                user_id: ban.user_id,
                guild_id: server._id,
                expires_timestamp: ban.expires_timestamp
            })
        }

        handledEntries += tempbans.length
    }

    self.logger.info({ count: handledEntries }, 'temporary bans loaded')
    return handledEntries
}

export interface TemporaryBanOptions {
    user_id: string
    guild_id: string
    expires_timestamp: number
    reason?: string
    initial?: boolean
}
