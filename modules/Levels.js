class Levels {
    /**
     * @param {import('../internals/Lacuna')} self
     * @param {import('../internals/Typings').ServerDocument} server
     * @param {import('discord.js').Message} message
     */
    static async HandleText(self, server, message) {
        if (!server.modules.levels.active) return false

        if (server.modules.levels.blocked.channels.includes(message.channel.id) || message.member.roles.cache.some(r => server.modules.levels.blocked.roles.includes(r.id))) return false
        if (server.modules.levels.allowed.channels.length || server.modules.levels.allowed.roles.length) {
            if (!server.modules.levels.allowed.channels.includes(message.channel.id)) return false
            if (!message.member.roles.cache.some(r => server.modules.levels.allowed.roles.includes(r.id))) return false
        }
    }
}

module.exports = Levels