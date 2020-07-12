const moment = require('moment')

class Command {
    /**
     * @param {import('../Fracture')} self
     * @param {import('../Typings').CommandInfo} data
     */
    constructor(self, data) {
        if (!self || (!data.fn || typeof data.fn !== 'function') || (!data.name || typeof data.name !== 'string')) {
            throw new TypeError('Incorrect arguments has provided. Please, check arguments and fix it.')
        }

        this.self = self

        this.fn = data.fn

        this.name = data.name

        this.group = data.group || null

        this.description = data.description || null

        this.aliases = data.aliases || null

        this.subcommands = data.subcommands || null

        this.uses = 0

        this.guild_only = Boolean(data.guild_only)

        this.owner_only = Boolean(data.owner_only)

        this.premium_only = Boolean(data.premium_only)

        this.hidden = Boolean(data.hidden)

        this.nsfw = Boolean(data.nsfw)

        this.throttling = data.throttling || null

        this.throttles = new Map()

        this.self_permissions = data.self_permissions || null

        this.user_permissions = data.user_permissions || null

        this.early_access = data.early_access || null

        this.self.commands.set(this.name, this)
    }
}