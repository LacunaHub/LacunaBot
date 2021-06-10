const { scheduleJob } = require('node-schedule')
const Logger = require('../Logger')

class TemporaryMute {
    /**
     * @param {import('../Lacuna')} self
     * @param {import('../Typings').TemporaryMuteConstructor} data
     */
    constructor(self, data) {
        this.self = self

        this.user_id = data.user_id

        this.guild_id = data.guild_id

        this.role_id = data.role_id

        this.expires = new Date(data.expires_timestamp)

        this.reason = data.reason

        this.schedule = null

        if (Date.now() >= this.expires.getTime() || this.expires.getTime() - Date.now() <= 30000) {
            this.unmute()
            this.deleteEntry()

            return
        }

        if (data.init) this.create()
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
        await this.self.db.servers.update({ _id: this.guild_id }, {
            $push: {
                'moderation.tempmutes': {
                    user_id: this.user_id,
                    role_id: this.role_id,
                    expires_timestamp: this.expires.getTime()
                }
            }
        })
    }

    async createSchedule() {
        this.schedule = scheduleJob(this.id, this.expires, () => this.delete())
        this.self.tempmutes.set(this.id, this)
    }

    async mute() {
        const guild = this.self.guilds.cache.get(this.guild_id)
        if (!guild || !guild.available) return false

        const server = await this.self.db.servers.find({ _id: guild.id })

        /**
         * @type {import('discord.js').GuildMember}
         */
        const member = await guild.members._fetchSingle({ user: this.user_id, cache: false })

        if (member) {
            if (server.moderation.roles.on_mute.remove_all_roles) {
                const current_roles = member.roles.cache.filter(r => r.editable && r.id != guild.id).map(r => r.id)
    
                await this.self.db.servers.update({ _id: guild.id }, {
                    $push: {
                        'moderation.roles.on_mute.returnable_roles': {
                            user_id: member.id,
                            roles: current_roles
                        }
                    }
                })
    
                const strict_roles = [...server.moderation.roles.on_mute.strict_roles.filter(r => current_roles.includes(r)), ...member.roles.cache.filter(r => !r.editable).map(r => r.id)]
    
                await member.roles.set([this.role_id, ...strict_roles], this.reason).catch(this.self.logger.error)
            }
            
            else {
                await member.roles.add(this.role_id, this.reason).catch(this.self.logger.error)
            }

            if (member.voice.channelID) await member.voice.kick(this.reason).catch(this.self.logger.error)

            return true
        }
    }

    async delete(scheduled = true) {
        await this.unmute(scheduled ? 'Temporary Mute' : '')
        await this.deleteEntry()
        await this.schedule.cancel()
        this.self.tempmutes.delete(this.id)
    }

    async deleteEntry() {
        await this.self.db.servers.update({ _id: this.guild_id }, {
            $pull: {
                'moderation.tempmutes': {
                    user_id: this.user_id
                }
            }
        })
    }

    async unmute(reason = 'Temporary Mute') {
        const guild = this.self.guilds.cache.get(this.guild_id)
        if (!guild || !guild.available) return null

        const server = await this.self.db.servers.find({ _id: guild.id })

        /**
         * @type {import('discord.js').GuildMember}
         */
        const member = await guild.members._fetchSingle({ user: this.user_id, cache: false })

        if (member) {
            const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == member.id)

            if (returnable_roles) {
                await this.self.db.servers.update({ _id: guild.id }, {
                    $pull: {
                        'moderation.roles.on_mute.returnable_roles': {
                            user_id: member.id
                        }
                    }
                })
    
                await member.roles.add(returnable_roles.roles.filter(r => guild.roles.cache.has(r))).catch(this.self.logger.error)
            }

            await member.roles.remove(this.role_id, reason).catch(this.self.logger.error)

            return true
        }
    }

    /**
     * @param {import('../Lacuna')} self
     */
    static async HandleEntries(self) {
        let servers = await self.db.servers.findSome({ 'moderation.tempmutes.0': { $exists: true } })

        servers = servers.filter(s => self.guilds.cache.has(s._id))

        let entries = 0

        if (servers.length) {
            for (const server of servers) {
                const tempmutes = server.moderation.tempmutes

                entries++

                for (const mute of tempmutes) {
                    new this(self, { user_id: mute.user_id, guild_id: server._id, role_id: mute.role_id, expires_timestamp: mute.expires_timestamp })
                }
            }
        }

        await Logger.log(`(Structures): Loaded ${entries} temporary mutes from ${servers.length} servers`)

        return entries
    }
}

module.exports = TemporaryMute