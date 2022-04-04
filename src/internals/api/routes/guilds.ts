import Router from '@koa/router'
import { Context } from 'koa'
import { ReactionElement, ServerDocument, IAutoVoice } from '../../../database/schemas/Servers'
import translator from '../../locale'
import { resolveObjectPath } from '../../utility/Utils'
import db from '../../../database'
import qdb from 'quick.db'
import Guilds from '../interfaces/Guilds'
import { authorize, checkPermissions } from '../utility/Authorize'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Constants } from 'discord.js'

const router: Router = new Router({ prefix: '/guilds' })
const dsc = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN)

router.use(authorize)

router.get('/:guild_id/settings', checkPermissions, getSettings)
router.post('/:guild_id/settings', checkPermissions, updateSettings)
router.post('/:guild_id/reactions/:method', checkPermissions, addOrEditReaction)
router.delete('/:guild_id/reactions/:reaction_id', checkPermissions, removeReaction)
router.post('/:guild_id/subscriptions/twitch/:method', checkPermissions, updateTwitchSubscriptions)
router.post('/:guild_id/subscriptions/youtube/:method', checkPermissions, updateYouTubeSubscriptions)
router.post('/:guild_id/autovoices/:method', checkPermissions, addOrUpdateAutoVoice)
router.delete('/:guild_id/autovoices/:channel_id', checkPermissions, removeAutoVoice)

async function getSettings(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const partial = ctx.request.headers['partial-guild'] as any

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const selfMember = await dsc.get(Routes.guildMember(guild_id, process.env.CLIENT_ID)).catch(() => {}) as any

    if (!selfMember) {
        ctx.status = 406; ctx.body = 'Not Acceptable'

        return
    }

    const guildChannels = await dsc.get(Routes.guildChannels(guild_id)).catch(() => {}) as any[] ?? []
    const guildRoles = await dsc.get(Routes.guildRoles(guild_id)).catch(() => {}) as any[] ?? []
    const guildEmojis = await dsc.get(Routes.guildEmojis(guild_id)).catch(() => {}) as any[] ?? []

    const selfRoles = selfMember ? guildRoles
        .sort((a, b) => a.position - b.position)
        .filter(r => selfMember.roles.includes(r.id) || r.tags?.bot_id == process.env.CLIENT_ID) : []
    const selfHighestRole = selfRoles.length ? selfRoles.reduce((x, y) => (compareRolePositions(x, y) ? y : x), selfRoles[0]) : null

    const channels = guildChannels
        .sort((a, b) => a.parent_id - b.parent_id || a.position - b.position)
        .map(c => { return { id: c.id, name: c.name, parentId: c.parent_id, position: c.position, type: Constants.ChannelTypes[c.type] ?? 'UNKNOWN' } })
    const roles = guildRoles
        .filter(r => !r.tags?.bot_id)
        .sort((a, b) => b.position - a.position)
        .map(r => { return { id: r.id, name: r.name, color: r.color, position: r.position, managed: r.managed, higher: !selfHighestRole || selfHighestRole.position <= r.position } })
    const emojis = guildEmojis
        .map(e => { return { id: e.id, name: e.name, animated: e.animated, url: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'png'}` } })

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
            ...JSON.parse(partial),
            channels: channels,
            roles: roles.filter(r => r.id != guild_id),
            emojis: emojis
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
            automoder: server.moderation.automoder,
            use_timeout_mute: server.moderation.use_timeout_mute
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
            autoreactions: server.modules.autoreactions,
            economy: server.modules.economy,
            subscriptions: server.modules.subscriptions
        },
        prices,
        change_log: server.change_log.reverse()
    }
}

async function updateSettings(ctx: Context) {
    const guild_id = ctx.params.guild_id
    const user_id = ctx.headers['user-id'] as string
    const data = ctx.request.body as Partial<ServerDocument>

    let server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const selfMember = await dsc.get(Routes.guildMember(guild_id, process.env.CLIENT_ID)).catch(() => {}) as any

    if (!selfMember) {
        ctx.status = 406; ctx.body = 'Not Acceptable'

        return
    }

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
            automoder: server.moderation.automoder,
            use_timeout_mute: server.moderation.use_timeout_mute
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
            autoreactions: server.modules.autoreactions,
            economy: server.modules.economy,
            subscriptions: server.modules.subscriptions
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

async function updateTwitchSubscriptions(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) ctx.throw(404, 'Not Found')

    let result: any

    switch(method) {
        case 'create':
            result = await Guilds.createTwitchSubscription(server, data)
        break

        case 'update':
            result = await Guilds.updateTwitchSubscription(server, data)
        break

        case 'delete':
            result = await Guilds.deleteTwitchSubscription(server, data)
        break

        default:
            result = 'unknown_method'
    }

    if (typeof result == 'string') ctx.throw(400, result)

    ctx.status = 200
    ctx.body = result
}

async function updateYouTubeSubscriptions(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) ctx.throw(404, 'Not Found')

    let result: any

    switch(method) {
        case 'create':
            result = await Guilds.createYouTubeSubscription(server, data)
        break

        case 'update':
            result = await Guilds.updateYouTubeSubscription(server, data)
        break

        case 'delete':
            result = await Guilds.deleteYouTubeSubscription(server, data)
        break

        default:
            result = 'unknown_method'
    }

    if (typeof result == 'string') ctx.throw(400, result)

    ctx.status = 200
    ctx.body = result
}

async function addOrUpdateAutoVoice(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const options = ctx.request.body as IAutoVoice | Partial<IAutoVoice>

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) ctx.throw(404, 'Not Found')

    const result = method == 'add' ? (await Guilds.addAutoVoice(server, options as IAutoVoice)) : (await Guilds.updateAutoVoice(server, options))

    if (typeof result === 'string') ctx.throw(400, result)

    ctx.status = 200; ctx.body = result
}

async function removeAutoVoice(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const channel_id: string = ctx.params.channel_id

    const server: ServerDocument = await db.servers.findOne({ _id: guild_id })

    if (!server || server.server.blocked) ctx.throw(404, 'Not Found')

    const result = await Guilds.removeAutoVoice(server, channel_id)

    if (typeof result === 'string') ctx.throw(400, result)

    ctx.status = 204
}

export default router

function compareRolePositions(first, second) {
    return first.position === second.position ? second.id - first.id : first.position - second.position
}