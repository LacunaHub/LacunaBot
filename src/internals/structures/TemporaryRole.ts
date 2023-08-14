import { GuildMember } from 'discord.js'
import { Job, scheduleJob } from 'node-schedule'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../Lacuna'
import { generateSimpleId } from '../utility/Utils'

export default class TemporaryRole {
    public self: Lacuna
    public user_id: string
    public guild_id: string
    public role_id: string
    public unique_id: string
    public expires: Date
    public schedule: Job

    constructor(self: Lacuna, options: TemporaryRoleOptions) {
        this.self = self

        this.user_id = options.user_id

        this.guild_id = options.guild_id

        this.role_id = options.role_id

        this.unique_id = options.unique_id ?? generateSimpleId(6)

        this.expires = new Date(options.expires_timestamp)

        this.schedule = null

        if (Date.now() >= this.expires.getTime() || this.expires.getTime() - Date.now() <= 30000) {
            this.removeRole()
            this.deleteEntry()

            return
        }

        if (options.initial) this.create()
        else this.createSchedule()
    }

    get id() {
        return `${this.guild_id}:${this.role_id}`
    }

    get guild() {
        return this.self.guilds.cache.get(this.guild_id)
    }

    async getMember(): Promise<GuildMember> {
        let member: GuildMember

        try {
            member = await this.guild.members.fetch({ user: this.user_id })
        } catch (err) {
            this.self.logger.handleError({ module: 'TemporaryRole', action: 'FetchGuildMember', error: err, guild_id: this.guild_id })
        }

        return member
    }

    async create() {
        await this.addRole()
        await this.createEntry()
        await this.createSchedule()
    }

    async createEntry() {
        await this.self.db.servers.updateOne(
            { _id: this.guild_id },
            {
                $push: {
                    'moderation.roles.temporary': {
                        user_id: this.user_id,
                        guild_id: this.guild_id,
                        role_id: this.role_id,
                        unique_id: this.unique_id,
                        expires_timestamp: this.expires.getTime()
                    }
                }
            }
        )
    }

    async createSchedule() {
        this.schedule = scheduleJob(this.id, this.expires, () => this.delete())
        this.self.temproles.set(this.id, this)
    }

    async addRole() {
        const member: GuildMember = await this.getMember()

        if (member) {
            try {
                await member.roles.add(this.role_id, 'Temporary Role')
            } catch (err) {
                this.self.logger.handleError({ module: 'TemporaryRole', action: 'AddRoles', error: err, guild_id: this.guild_id })
            }
        }
    }

    async delete() {
        await this.removeRole()
        await this.deleteEntry()
        this.schedule.cancel()
        this.self.temproles.delete(this.id)
    }

    async deleteEntry() {
        await this.self.db.servers.updateOne(
            { _id: this.guild_id },
            {
                $pull: {
                    'moderation.roles.temporary': {
                        unique_id: this.unique_id
                    }
                }
            }
        )
    }

    async removeRole() {
        const member: GuildMember = await this.getMember()

        if (member && member.roles.cache.has(this.role_id)) {
            try {
                await member.roles.remove(this.role_id, 'Temporary Role')
            } catch (err) {
                this.self.logger.handleError({ module: 'TemporaryRole', action: 'RemoveRoles', error: err, guild_id: this.guild_id })
            }
        } else {
            await this.deleteEntry()
        }
    }
}

export async function handleEntries(self: Lacuna): Promise<number> {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'moderation.roles.temporary.0': { $exists: true } })

    let entries = 0

    if (servers.length) {
        for (const server of servers) {
            const temproles = server.moderation.roles.temporary

            for (const role of temproles) {
                new TemporaryRole(self, {
                    user_id: role.user_id,
                    guild_id: server._id,
                    role_id: role.role_id,
                    unique_id: role.unique_id,
                    expires_timestamp: role.expires_timestamp
                })
            }

            entries += temproles.length
        }
    }

    self.logger.log(`[TemporaryRole] Loaded ${entries} temporary roles from ${servers.length} servers`)

    return entries
}

export interface TemporaryRoleOptions {
    user_id: string
    guild_id: string
    role_id: string
    unique_id?: string
    expires_timestamp: number
    initial?: boolean
}
