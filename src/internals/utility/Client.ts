import { Collection, GatewayIntentBits, LimitedCollection, Partials } from 'discord.js'
import Lacuna from '../Lacuna'

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
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction],
    makeCache: manager => {
        if (manager.name == 'GuildBanManager') return new LimitedCollection({ maxSize: 20 })

        if (manager.name == 'GuildInviteManager') return new LimitedCollection({ maxSize: 20 })

        if (manager.name == 'GuildMemberManager')
            return new LimitedCollection({
                maxSize: 1000,
                keepOverLimit: v => v.id == process.env.DISCORD_CLIENT_ID || v.voice.channelId
            })

        if (manager.name == 'GuildScheduledEventManager') return new LimitedCollection({ maxSize: 0 })

        if (manager.name == 'MessageManager') return new LimitedCollection({ maxSize: 25 })

        if (manager.name == 'UserManager')
            return new LimitedCollection({
                maxSize: 5000,
                keepOverLimit: v => v.id == process.env.DISCORD_CLIENT_ID
            })

        return new Collection()
    },
    sweepers: {
        messages: {
            interval: 60,
            filter: () => v => Date.now() - v.createdTimestamp > 1800000
        }
    }
})
