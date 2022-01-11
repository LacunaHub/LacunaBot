import Lacuna from '../Lacuna'
import { Collection, LimitedCollection } from 'discord.js'

const { version } = require('../../../package.json')

export default new Lacuna({
    presence: {
        status: 'online',
        activities: [
            {
                name: `voidlacuna.ru (v${version.split('.').slice(0, 2).join('.')})`
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
        if (manager.name == 'MessageManager') return new LimitedCollection({ maxSize: 25 })

        if (manager.name == 'UserManager') return new LimitedCollection({
            maxSize: 15000,
            keepOverLimit: v => v.id == process.env.CLIENT_ID
        })

        if (manager.name == 'GuildMemberManager') return new LimitedCollection({
            maxSize: 1000,
            keepOverLimit: v => v.id == process.env.CLIENT_ID || v.voice.channelId
        })

        if (manager.name == 'GuildInviteManager') return new LimitedCollection({ maxSize: 5 })

        return new Collection()
    },
    sweepers: {
        messages: {
            interval: 60,
            filter: () => v => (Date.now() - v.createdTimestamp) > 1800000
        }
    }
})