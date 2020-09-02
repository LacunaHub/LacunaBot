const Lacuna = require('../Lacuna')
const { version } = require('../../package.json')

module.exports = new Lacuna({
    presence: {
        status: 'online',
        activity: {
            name: `v${version}`
        }
    },
    messageCacheMaxSize: 100,
    messageCacheLifetime: 7200,
    messageSweepInterval: 60,
    ws: {
        intents: [
            'GUILDS',
            'GUILD_BANS',
            'GUILD_EMOJIS',
            'GUILD_INVITES',
            'GUILD_MEMBERS',
            'GUILD_MESSAGES',
            'GUILD_MESSAGE_REACTIONS',
            'GUILD_PRESENCES',
            'GUILD_VOICE_STATES',
            'GUILD_WEBHOOKS'
        ]
    },
    partials: ['USER', 'GUILD_MEMBER', 'MESSAGE', 'REACTION']
})