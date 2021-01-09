const { scheduleJob } = require('node-schedule')

class TemporaryRole {
    /**
     * @param {import('../Lacuna')} self
     * @param {import('../Typings').TemporaryRoleConstructor} data
     */
    constructor(self, data) {
        this.self = self

        this.user_id = data.user_id

        this.guild_id = data.guild_id

        this.role_id = data.role_id

        this.unique_id = data.unique_id

        this.expires = new Date(data.expires_timestamp)

        this.schedule = null

        if (Date.now() >= this.expires.getTime() || this.expires.getTime() - Date.now() <= 30000) {
            this.removeRole()
            this.deleteEntry()

            return
        }

        if (data.init) this.create()
        else this.createSchedule()
    }

    get id() {
        return `${this.guild_id}:${this.role_id}`
    }

    get guild() {
        return this.self.guilds.cache.get(this.guild_id)
    }

    async getMember() {
        try {
            return await this.guild.members.fetch(this.user_id)
        } catch (err) {
            return null
        }
    }

    async create() {
        await this.addRole()
        await this.createEntry()
        await this.createSchedule()
    }

    async createEntry() {
        await this.self.db.servers.update({ _id: this.guild_id }, {
            $push: {
                'moderation.roles.temporary': {
                    user_id: this.user_id,
                    guild_id: this.guild_id,
                    role_id: this.role_id,
                    unique_id: this.unique_id,
                    expires_timestamp: this.expires.getTime()
                }
            }
        })
    }

    async createSchedule() {
        this.schedule = scheduleJob(this.id, this.expires, () => this.delete())
        this.self.temproles.set(this.id, this)
    }

    async addRole() {
        const member = await this.getMember()

        if (member) {
            await member.roles.add(this.role_id, 'Temporary Role')
        }
    }

    async delete() {
        await this.removeRole()
        await this.deleteEntry()
        await this.schedule.cancel()
        await this.self.temproles.delete(this.id)
    }

    async deleteEntry() {
        await this.self.db.servers.update({ _id: this.guild_id }, {
            $pull: {
                'moderation.roles.temporary': {
                    unique_id: this.unique_id
                }
            }
        })
    }

    async removeRole() {
        const member = await this.getMember()

        if (member && member.roles.cache.has(this.role_id)) {
            await member.roles.remove(this.role_id, 'Temporary Role')
        }
    }

    /**
     * @param {import('../Lacuna')} self
     */
    static async HandleEntries(self) {
        let servers = await self.db.servers.findSome({ 'moderation.roles.temporary.0': { $exists: true } })

        servers = servers.filter(s => self.guilds.cache.has(s._id))

        let entries = 0

        if (servers.length) {
            for (const server of servers) {
                const temproles = server.moderation.roles.temporary

                entries++

                for (const role of temproles) {
                    new this(self, { user_id: role.user_id, guild_id: server._id, role_id: role.role_id, unique_id: role.unique_id, expires_timestamp: role.expires_timestamp })
                }
            }
        }

        return entries
    }
}

module.exports = TemporaryRole