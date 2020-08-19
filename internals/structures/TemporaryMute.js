const { scheduleJob } = require('node-schedule')

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
        if (!guild || !guild.available) return null

        try {
            let member = guild.members.cache.get(this.user_id)
            if (!member) member = await guild.members.fetch(this.user_id)

            if (member) {
                await member.roles.add(this.role_id, this.reason)
            }
        } catch (err) {}
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

        try {
            let member = guild.members.cache.get(this.user_id)
            if (!member) member = await guild.members.fetch(this.user_id)

            if (member && member.roles.cache.has(this.role_id)) {
                await member.roles.remove(this.role_id, reason)
            }
        } catch (err) {}
    }

    /**
     * @param {import('../Lacuna')} self
     */
    static async AddEntries(self) {
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

        return entries
    }
}

module.exports = TemporaryMute