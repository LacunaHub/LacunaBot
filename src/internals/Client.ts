import { ClusterClient } from 'discord-hybrid-sharding'
import { ActivityType, Collection, GatewayIntentBits, LimitedCollection, Options, Partials } from 'discord.js'
import Lacuna from './Lacuna'

const { version } = require('../../package.json')
const clusterClientInfo = ClusterClient.getInfo()

const client = new Lacuna({
    presence: {
        status: 'online',
        activities: [
            {
                name: `lacunabot.com (v${version.split('.').slice(0, 2).join('.')})`,
                type: ActivityType.Custom
            }
        ]
    },
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
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
        if (manager.name === 'GuildBanManager') return new LimitedCollection({ maxSize: 100 })

        if (manager.name === 'GuildInviteManager') return new LimitedCollection({ maxSize: 10 })

        if (manager.name === 'GuildMemberManager')
            return new LimitedCollection({
                maxSize: 1000,
                keepOverLimit: v => v.id === process.env.LCN_DISCORD_CLIENT_ID || Boolean(v.voice.channelId)
            })

        if (manager.name === 'GuildScheduledEventManager') return new LimitedCollection({ maxSize: 0 })

        if (manager.name === 'MessageManager') return new LimitedCollection({ maxSize: 25 })

        if (manager.name === 'UserManager')
            return new LimitedCollection({
                maxSize: 1000,
                keepOverLimit: v => v.id === process.env.LCN_DISCORD_CLIENT_ID
            })

        return new Collection()
    },
    rest: {
        rejectOnRateLimit: rateLimitData => rateLimitData.timeToReset >= 1000 * 2.5
    },
    sweepers: {
        ...Options.DefaultSweeperSettings,
        bans: {
            interval: 15 * 60,
            filter: () => ban => {
                return true
            }
        },
        invites: {
            interval: 15 * 60,
            lifetime: 30 * 60
        },
        guildMembers: {
            interval: 30 * 60,
            filter: () => member => {
                return Boolean(member.voice?.channelId) === false && member.id !== process.env.LCN_DISCORD_CLIENT_ID
            }
        },
        messages: {
            interval: 15 * 60,
            lifetime: 30 * 60
        },
        reactions: {
            interval: 15 * 60,
            filter: () => reaction => {
                return Date.now() - reaction.message.createdTimestamp > 30 * 60 * 1000
            }
        },
        threads: {
            interval: 15 * 60,
            lifetime: 30 * 60
        },
        users: {
            interval: 30 * 60,
            filter: () => user => {
                return user.id !== process.env.LCN_DISCORD_CLIENT_ID
            }
        },
        voiceStates: {
            interval: 15 * 60,
            filter: () => state => {
                return Boolean(state.channelId) === false
            }
        }
    },
    shards: clusterClientInfo.SHARD_LIST,
    shardCount: clusterClientInfo.TOTAL_SHARDS
})

export default client
