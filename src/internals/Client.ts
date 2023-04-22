import { ClusterClient } from 'discord-hybrid-sharding'
import { Collection, GatewayIntentBits, LimitedCollection, Partials } from 'discord.js'
import Lacuna from './Lacuna'

const { version } = require('../../package.json')
const clusterClientInfo = ClusterClient.getInfo()

const client = new Lacuna({
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
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction],
    makeCache: manager => {
        if (manager.name == 'GuildBanManager') return new LimitedCollection({ maxSize: 100 })

        if (manager.name == 'GuildInviteManager') return new LimitedCollection({ maxSize: 10 })

        if (manager.name == 'GuildMemberManager')
            return new LimitedCollection({
                maxSize: 1000,
                keepOverLimit: v => v.id == process.env.DISCORD_CLIENT_ID || v.voice.channelId
            })

        if (manager.name == 'GuildScheduledEventManager') return new LimitedCollection({ maxSize: 0 })

        if (manager.name == 'MessageManager') return new LimitedCollection({ maxSize: 25 })

        if (manager.name == 'UserManager')
            return new LimitedCollection({
                maxSize: 1000,
                keepOverLimit: v => v.id == process.env.DISCORD_CLIENT_ID
            })

        return new Collection()
    },
    sweepers: {
        messages: {
            interval: 15 * 60,
            filter: () => v => Date.now() - v.createdTimestamp > 30 * 60 * 1000
        }
    },
    shards: clusterClientInfo.SHARD_LIST,
    shardCount: clusterClientInfo.TOTAL_SHARDS
})

export default client
