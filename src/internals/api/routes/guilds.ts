import Router from '@koa/router'
import { Context } from 'koa'
import { ReactionElement, ServerDocument, TwitchChannel, VoiceChannelTrigger, YouTubeChannel } from '../../../database/schemas/Servers'
import { sharding } from '../../../index'
import { GuildChannel } from 'discord.js'
import translator from '../../locale'
import { resolveObjectPath } from '../../utility/Utils'
import db from '../../../database'
import qdb from 'quick.db'
import Guilds from '../interfaces/Guilds'
import { authorize, checkPermissions } from '../utility/Authorize'
import { searchChannels as searchTwitchChannels } from '../../../modules/Twitch'
import { searchChannels as searchYouTubeChannels } from '../../../modules/YouTube'

const router: Router = new Router({ prefix: '/guilds' })

router.use(authorize)

router.get('/:guild_id/settings', checkPermissions, getSettings)
router.post('/:guild_id/settings', checkPermissions, updateSettings)
router.post('/:guild_id/reactions/:method', checkPermissions, addOrEditReaction)
router.delete('/:guild_id/reactions/:reaction_id', checkPermissions, removeReaction)
router.get('/:guild_id/twitch/search', checkPermissions, searchTwitch)
router.post('/:guild_id/twitch/:method', checkPermissions, addOrEditTwitch)
router.delete('/:guild_id/twitch/:channel_id', checkPermissions, removeTwitch)
router.get('/:guild_id/youtube/search', checkPermissions, searchYouTube)
router.post('/:guild_id/youtube/:method', checkPermissions, addOrEditYouTube)
router.delete('/:guild_id/youtube/:channel_id', checkPermissions, removeYouTube)
router.post('/:guild_id/voice-triggers/:method', checkPermissions, addOrEditVoiceTrigger)
router.delete('/:guild_id/voice-triggers/:channel_id', checkPermissions, removeVoiceTrigger)

async function getSettings(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const partial = ctx.request.headers['partial-guild'] as any

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const guild = (await sharding.broadcastEval(
        (self, ctx) => {
            const guild = self.guilds.cache.get(ctx.guild_id)
            const channels = guild?.channels?.cache?.sort((a: GuildChannel, b: GuildChannel) => (a.parentId as any) - (b.parentId as any) || (a.position as any) - (b.position as any))
            const roles = guild?.roles?.cache?.filter(r => !r.managed)?.sort((a, b) => b.rawPosition - a.rawPosition)?.map(r => {
                return { ...r, higher: !r.editable, guild: null }
            })
            const emojis = self.emojis.cache.filter(e => e.guild.id == ctx.guild_id)
            const permissions = guild?.me?.permissions?.toArray()

            return guild ? Object.assign({}, { channels, roles, emojis, permissions }) : null
        }, { context: { guild_id } })
    ).filter(data => data)[0]

    const locale = translator.locale(server.locale)

    const commands = qdb.get('commands').map(c => { return { ...c, description: resolveObjectPath(c.description, locale), options: [] } })
    const { diamondPrices: prices } = await db.json.get()

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        prefix: server.prefix,
        premium: server.server.premium,
        server: {
            bot_expert_roles: server.server.bot_expert_roles,
        },
        commands: {
            ...server.commands, list: commands
        },
        guild: {
            ...partial,
            channels: guild.channels,
            roles: guild.roles.filter(r => r.id != guild_id),
            emojis: guild.emojis,
            permissions: guild.permissions
        },
        moderation: {
            case_log: {
                channel_id: server.moderation.case_log.channel_id,
                case_types: server.moderation.case_log.case_types,
                case_types_messages: server.moderation.case_log.case_types_messages
            },
            logs: {
                types: server.moderation.logs.types
            },
            warnings: {
                penalties: server.moderation.warnings.penalties
            },
            roles: {
                mute: server.moderation.roles.mute,
                on_mute: {
                    remove_all_roles: server.moderation.roles.on_mute.remove_all_roles,
                    strict_roles: server.moderation.roles.on_mute.strict_roles
                }
            },
            automoder: server.moderation.automoder
        },
        modules: {
            welcome: server.modules.welcome,
            farewell: server.modules.farewell,
            levels: server.modules.levels,
            voice_manager: server.modules.voice_manager,
            restoring: {
                restore_roles: server.modules.restoring.restore_roles,
                restore_nicknames: server.modules.restoring.restore_nicknames,
                strict_roles: server.modules.restoring.strict_roles
            },
            reports: server.modules.reports,
            music: server.modules.music,
            reactions: server.modules.reactions,
            twitch: {
                channels: server.modules.twitch.channels
            },
            youtube: {
                channels: server.modules.youtube.channels
            },
            autoreactions: server.modules.autoreactions
        },
        prices,
        change_log: server.change_log.reverse()
    }
}

async function updateSettings(ctx: Context) {
    const guild_id = ctx.params.guild_id
    const partial = ctx.request.headers['partial-guild'] as any
    const user_id = ctx.headers['user-id'] as string
    const data = ctx.request.body as Partial<ServerDocument>

    let server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const guild = (await sharding.broadcastEval(
        (self, ctx) => {
            const guild = self.guilds.cache.get(ctx.guild_id)
            const channels = guild?.channels?.cache?.sort((a: GuildChannel, b: GuildChannel) => (a.parentId as any) - (b.parentId as any) || (a.position as any) - (b.position as any))
            const roles = guild?.roles?.cache?.filter(r => !r.managed)?.sort((a, b) => b.rawPosition - a.rawPosition)?.map(r => {
                return { ...r, higher: !r.editable, guild: null }
            })
            const emojis = self.emojis.cache.filter(e => e.guild.id == ctx.guild_id)
            const permissions = guild?.me?.permissions?.toArray()

            return guild ? Object.assign({}, { channels, roles, emojis, permissions }) : null
        }, { context: { guild_id } })
    ).filter(data => data)[0]

    const locale = translator.locale(server.locale)

    const commands = qdb.get('commands').map(c => { return { ...c, description: resolveObjectPath(c.description, locale), options: [] } })
    const { diamondPrices: prices } = await db.json.get()

    server = await Guilds.updateSettings(server, data, user_id)

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        prefix: server.prefix,
        premium: server.server.premium,
        server: {
            bot_expert_roles: server.server.bot_expert_roles,
        },
        commands: {
            ...server.commands, list: commands
        },
        guild: {
            ...partial,
            channels: guild.channels,
            roles: guild.roles.filter(r => r.id != guild_id),
            emojis: guild.emojis,
            permissions: guild.permissions
        },
        moderation: {
            case_log: {
                channel_id: server.moderation.case_log.channel_id,
                case_types: server.moderation.case_log.case_types,
                case_types_messages: server.moderation.case_log.case_types_messages
            },
            logs: {
                types: server.moderation.logs.types
            },
            warnings: {
                penalties: server.moderation.warnings.penalties
            },
            roles: {
                mute: server.moderation.roles.mute,
                on_mute: {
                    remove_all_roles: server.moderation.roles.on_mute.remove_all_roles,
                    strict_roles: server.moderation.roles.on_mute.strict_roles
                }
            },
            automoder: server.moderation.automoder
        },
        modules: {
            welcome: server.modules.welcome,
            farewell: server.modules.farewell,
            levels: server.modules.levels,
            voice_manager: server.modules.voice_manager,
            restoring: {
                restore_roles: server.modules.restoring.restore_roles,
                restore_nicknames: server.modules.restoring.restore_nicknames,
                strict_roles: server.modules.restoring.strict_roles
            },
            reports: server.modules.reports,
            music: server.modules.music,
            reactions: server.modules.reactions,
            twitch: {
                channels: server.modules.twitch.channels
            },
            youtube: {
                channels: server.modules.youtube.channels
            },
            autoreactions: server.modules.autoreactions
        },
        prices,
        change_log: server.change_log.reverse()
    }
}

async function addOrEditReaction(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const options = ctx.request.body as ReactionElement | Partial<ReactionElement>

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const result = method == 'add' ? (await Guilds.addReactionElement(server, options)) : (await Guilds.editReactionElement(server, options as ReactionElement))

    if (typeof result === 'string') {
        ctx.status = 400; ctx.body = result

        return
    }

    ctx.status = 200; ctx.body = result
}

async function removeReaction(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const reaction_id: string = ctx.params.reaction_id

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const result = await Guilds.removeReactionElement(server, reaction_id)

    if (typeof result === 'string') {
        ctx.status = 400; ctx.body = result

        return
    }

    ctx.status = 204
}

async function searchTwitch(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const query = ctx.query.q as string

    if (!guild_id || !query) {
        ctx.status = 400; ctx.body = 'Bad Request'

        return
    }

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const channels = await searchTwitchChannels(query)

    if (!channels || !channels.length) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const added = server.modules.twitch.channels

    ctx.status = 200
    ctx.body = channels.filter(channel => !added.some(c => c.channel.id == channel.id))
}

async function addOrEditTwitch(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const options = ctx.request.body as TwitchChannel | Partial<TwitchChannel>

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const result = method == 'add' ? (await Guilds.addTwitchChannel(server, options)) : (await Guilds.editTwitchChannel(server, options as TwitchChannel))

    if (typeof result === 'string') {
        ctx.status = 400; ctx.body = result

        return
    }

    ctx.status = 200; ctx.body = result
}

async function removeTwitch(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const channel_id: number = Number(ctx.params.channel_id)

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const result = await Guilds.removeTwitchChannel(server, channel_id)

    if (typeof result === 'string') {
        ctx.status = 400; ctx.body = result

        return
    }

    ctx.status = 204
}

async function searchYouTube(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const query = ctx.query.q as string

    if (!guild_id || !query) {
        ctx.status = 400; ctx.body = 'Bad Request'

        return
    }

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const channels = await searchYouTubeChannels(query)

    if (!channels || !channels.length) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const added = server.modules.youtube.channels

    ctx.status = 200
    ctx.body = channels.filter(channel => !added.some(c => c.channel.id == channel.id))
}

async function addOrEditYouTube(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const options = ctx.request.body as YouTubeChannel | Partial<YouTubeChannel>

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const result = method == 'add' ? (await Guilds.addYouTubeChannel(server, options)) : (await Guilds.editYouTubeChannel(server, options as YouTubeChannel))

    if (typeof result === 'string') {
        ctx.status = 400; ctx.body = result

        return
    }

    ctx.status = 200; ctx.body = result
}

async function removeYouTube(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const channel_id: string = ctx.params.channel_id

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const result = await Guilds.removeYouTubeChannel(server, channel_id)

    if (typeof result === 'string') {
        ctx.status = 400; ctx.body = result

        return
    }

    ctx.status = 204
}

async function addOrEditVoiceTrigger(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const options = ctx.request.body as VoiceChannelTrigger | Partial<VoiceChannelTrigger>

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const result = method == 'add' ? (await Guilds.addVoiceTrigger(server, options as VoiceChannelTrigger)) : (await Guilds.editVoiceTrigger(server, options))

    if (typeof result === 'string') {
        ctx.status = 400; ctx.body = result

        return
    }

    ctx.status = 200; ctx.body = result
}

async function removeVoiceTrigger(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const channel_id: string = ctx.params.channel_id

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const result = await Guilds.removeVoiceTrigger(server, channel_id)

    if (typeof result === 'string') {
        ctx.status = 400; ctx.body = result

        return
    }

    ctx.status = 204
}

export default router