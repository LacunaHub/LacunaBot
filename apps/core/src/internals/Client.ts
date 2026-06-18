import { ActivityType, Collection, GatewayIntentBits, LimitedCollection, Options, Partials } from 'discord.js'
import Lacuna from './Lacuna.js'
import { buildInfo } from './utility/BuildInfo.js'

const client = new Lacuna({
    presence: {
        status: 'online',
        activities: [
            {
                name: `lacunabot.com (${buildInfo?.ref ?? 'dev'})`,
                type: ActivityType.Custom
            }
        ]
    },
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution
    ],
    partials: [Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction],
    makeCache: manager => {
        if (manager.name === 'GuildBanManager') return new LimitedCollection({ maxSize: 100 })

        if (manager.name === 'GuildInviteManager') return new LimitedCollection({ maxSize: 10 })

        if (manager.name === 'GuildMemberManager')
            return new LimitedCollection({
                maxSize: 2500,
                keepOverLimit: v => v.id === process.env.LCN_DISCORD_CLIENT_ID || !!v.voice?.channelId
            })

        if (manager.name === 'GuildScheduledEventManager') return new LimitedCollection({ maxSize: 0 })

        if (manager.name === 'MessageManager') return new LimitedCollection({ maxSize: 100 })

        if (manager.name === 'UserManager')
            return new LimitedCollection({
                maxSize: 10000,
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
            filter: () => _ban => true
        },
        invites: {
            interval: 15 * 60,
            lifetime: 30 * 60
        },
        guildMembers: {
            interval: 60 * 60,
            filter: () => member => {
                return !!member.voice?.channelId === false && member.id !== process.env.LCN_DISCORD_CLIENT_ID
            }
        },
        messages: {
            interval: 15 * 60,
            lifetime: 30 * 60
        },
        reactions: {
            interval: 15 * 60,
            filter: () => reaction => {
                return Date.now() - reaction.message.createdTimestamp > 1000 * 60 * 30
            }
        },
        threads: {
            interval: 15 * 60,
            lifetime: 30 * 60
        },
        users: {
            interval: 60 * 60,
            filter: () => user => {
                return user.id !== process.env.LCN_DISCORD_CLIENT_ID
            }
        },
        voiceStates: {
            interval: 15 * 60,
            filter: () => state => {
                return !!state.channelId === false
            }
        }
    }
})

export default client
