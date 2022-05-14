import { Guild, GuildMember } from 'discord.js'
import { Job, scheduleJob } from 'node-schedule'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../Lacuna'

export default class TemporaryMute {
    public self: Lacuna
    public user_id: string
    public guild_id: string
    public role_id: string
    public expires: Date
    public reason?: string
    public schedule: Job

    constructor(self: Lacuna, options: TemporaryMuteOptions) {
        this.self = self

        this.user_id = options.user_id

        this.guild_id = options.guild_id

        this.role_id = options.role_id

        this.expires = new Date(options.expires_timestamp)

        this.reason = options.reason ?? null

        this.schedule = null

        if (Date.now() >= this.expires.getTime() || this.expires.getTime() - Date.now() <= 30000) {
            this.unmute()
            this.deleteEntry()

            return
        }

        if (options.initial) this.create()
        else this.createSchedule()
    }

    get id() {
        return `${this.guild_id}:${this.user_id}`
    }

    async create() {
        this.mute()
        this.createEntry()
        this.createSchedule()
    }

    async createEntry() {
        await this.self.db.servers.updateOne(
            { _id: this.guild_id },
            {
                $push: {
                    'moderation.tempmutes': {
                        user_id: this.user_id,
                        role_id: this.role_id,
                        expires_timestamp: this.expires.getTime()
                    }
                }
            }
        )
    }

    async createSchedule() {
        this.schedule = scheduleJob(this.id, this.expires, () => this.delete())
        this.self.tempmutes.set(this.id, this)
    }

    async mute() {
        const guild: Guild = this.self.guilds.cache.get(this.guild_id)

        if (guild && guild.available) {
            const server: ServerDocument = await this.self.db.servers.findOne({ _id: guild.id })
            const member = (await guild.members.fetch(this.user_id).catch(() => {})) as GuildMember

            if (member) {
                if (server.moderation.roles.on_mute.remove_all_roles) {
                    const current_roles: string[] = member.roles.cache.filter(r => r.editable && r.id != guild.id).map(r => r.id)

                    await this.self.db.servers.updateOne(
                        { _id: guild.id },
                        {
                            $push: {
                                'moderation.roles.on_mute.returnable_roles': {
                                    user_id: member.id,
                                    roles: current_roles
                                }
                            }
                        }
                    )

                    const strict_roles: string[] = [
                        ...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)),
                        ...member.roles.cache.filter(r => !r.editable).map(r => r.id)
                    ]

                    await member.roles.set([this.role_id, ...strict_roles], this.reason).catch(this.self.logger.error)
                } else {
                    await member.roles.add(this.role_id, this.reason).catch(this.self.logger.error)
                }

                if (member.voice?.channelId) await member.voice.setMute(true, this.reason).catch(this.self.logger.error)
            }
        }
    }

    async delete(scheduled = true) {
        await this.unmute(scheduled ? 'Temporary Mute' : '')
        await this.deleteEntry()
        this.schedule.cancel()
        this.self.tempmutes.delete(this.id)
    }

    async deleteEntry() {
        await this.self.db.servers.updateOne(
            { _id: this.guild_id },
            {
                $pull: {
                    'moderation.tempmutes': {
                        user_id: this.user_id
                    }
                }
            }
        )
    }

    async unmute(reason = 'Temporary Mute') {
        const guild: Guild = this.self.guilds.cache.get(this.guild_id)

        if (guild && guild.available) {
            const server: ServerDocument = await this.self.db.servers.findOne({ _id: guild.id })
            const member = (await guild.members.fetch(this.user_id).catch(() => {})) as GuildMember

            if (member) {
                const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == member.id)

                if (returnable_roles) {
                    await this.self.db.servers.updateOne(
                        { _id: guild.id },
                        {
                            $pull: {
                                'moderation.roles.on_mute.returnable_roles': {
                                    user_id: member.id
                                }
                            }
                        }
                    )

                    await member.roles.add(returnable_roles.roles.filter(r => guild.roles.cache.has(r))).catch(this.self.logger.error)
                }

                await member.roles.remove(this.role_id, reason).catch(this.self.logger.error)
                if (member.voice?.channelId && member.voice?.serverMute) await member.voice.setMute(false, reason)
            } else {
                await this.deleteEntry()
            }
        }
    }
}

export async function handleEntries(self: Lacuna): Promise<number> {
    const guilds: string[] = self.guilds.cache.map(g => g.id)
    const servers: ServerDocument[] = await self.db.servers.find({ _id: { $in: guilds }, 'moderation.tempmutes.0': { $exists: true } })

    let entries = 0

    if (servers.length) {
        for (const server of servers) {
            const tempmutes = server.moderation.tempmutes

            for (const mute of tempmutes) {
                new TemporaryMute(self, { user_id: mute.user_id, guild_id: server._id, role_id: mute.role_id, expires_timestamp: mute.expires_timestamp })
            }

            entries += tempmutes.length
        }
    }

    self.logger.log(`(Structures): Loaded ${entries} temporary mutes from ${servers.length} servers`)

    return entries
}

export interface TemporaryMuteOptions {
    user_id: string
    guild_id: string
    role_id: string
    expires_timestamp: number
    reason?: string
    initial?: boolean
}
