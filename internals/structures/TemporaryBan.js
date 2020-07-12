const { scheduleJob } = require('node-schedule')

class TemporaryBan {
    /**
     * @param {import('../Fracture')} self
     * @param {import('../Typings').TemporaryBanConstructor} data
     */
    constructor(self, data) {
        this.self = self

        this.user_id = data.user_id

        this.guild_id = data.guild_id

        this.expires = new Date(data.expires_timestamp)

        this.reason = data.reason

        this.schedule = null

        if (Date.now() >= this.expires.getTime() || this.expires.getTime() - Date.now() <= 30000) {
            this.unban()
            this.deleteEntry()

            return
        }

        if (data.init) this.create()
        else this.createSchedule()
    }

    async create() {
        await this.ban()
        await this.createEntry()
        await this.createSchedule()
    }

    async createEntry() {
        await this.self.db.servers.update({ _id: this.guild_id }, {
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
        await this.self.tempbans.set(`${this.guild_id}:${this.user_id}`, this)
    }

    async ban() {
        const guild = this.self.guilds.cache.get(this.guild_id)
        if (!guild || !guild.available) return null

        try {
            await guild.members.ban(this.user_id, { reason: this.reason })
        } catch (err) {}
    }

    async delete() {
        await this.unban()
        await this.deleteEntry()
        await this.schedule.cancel()
        await this.self.tempbans.delete(`${this.guild_id}:${this.user_id}`)
    }

    async deleteEntry() {
        await this.self.db.servers.update({ _id: this.guild_id }, {
            $pull: {
                'moderation.tempbans': {
                    user_id: this.user_id
                }
            }
        })
    }

    async unban() {
        const guild = this.self.guilds.cache.get(this.guild_id)
        if (!guild || !guild.available) return null

        try {
            await guild.members.unban(this.user_id)
        } catch (err) {}
    }

    /**
     * @param {import('../Fracture')} self
     */
    static async HandleEntries(self) {
        let servers = await self.db.servers.findSome({ 'moderation.tempbans.0': { $exists: true } })

        servers = servers.filter(s => self.guilds.cache.has(s._id))

        let entries = 0

        if (servers.length) {
            for (const server of servers) {
                const tempbans = server.moderation.tempbans

                entries++

                for (const ban of tempbans) {
                    new this(self, { user_id: ban.user_id, guild_id: server._id, expires_timestamp: ban.expires_timestamp })
                }
            }
        }

        return entries
    }
}

module.exports = TemporaryBan