const Lacuna = require('../Lacuna')
const { version } = require('../../package.json')
const { LimitedCollection, Collection } = require('discord.js')

const lacuna = new Lacuna({
    presence: {
        status: 'online',
        activities: [
            {
                name: `voidlacuna.ru (v${version})`
            }
        ]
    },
    intents: [
        'GUILDS',
        'GUILD_MEMBERS',
        'GUILD_BANS',
        'GUILD_EMOJIS_AND_STICKERS',
        'GUILD_WEBHOOKS',
        'GUILD_INVITES',
        'GUILD_VOICE_STATES',
        'GUILD_MESSAGES',
        'GUILD_MESSAGE_REACTIONS'
    ],
    partials: ['USER', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
    makeCache: manager => {
        if (manager.name == 'MessageManager') return new LimitedCollection({
            maxSize: 50,
            sweepFilter: () => v => (Date.now() - v.createdTimestamp) > 3600000,
            sweepInterval: 120
        })

        if (manager.name == 'UserManager') return new LimitedCollection({
            maxSize: 30000,
            keepOverLimit: v => v.id == process.env.CLIENT_ID
        })

        if (manager.name == 'GuildMemberManager') return new LimitedCollection({
            maxSize: 1500,
            sweepFilter: () => v => v.id != process.env.CLIENT_ID,
            sweepInterval: 300
        })

        return new Collection()
    }
})

module.exports = lacuna
