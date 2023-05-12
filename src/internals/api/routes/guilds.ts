import Router from '@koa/router'
import {
    APIApplicationCommand,
    APIEmoji,
    APIGuildChannel,
    APIGuildMember,
    APIRole,
    ChannelType,
    makeURLSearchParams,
    PermissionsBitField
} from 'discord.js'
import { Context } from 'koa'
import db from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import DiscordUtils from '../../utility/DiscordUtils'
import interfaces from '../interfaces'
import { authorize, checkPermissions } from '../utility/Authorize'
import { createRateLimitMiddleware } from '../utility/Utils'

const router: Router = new Router({ prefix: '/guilds' })

router.use(createRateLimitMiddleware(20, 300000))
router.use(authorize)

router.get('/:guild_id/settings', checkPermissions, getSettings)
router.post('/:guild_id/settings', checkPermissions, updateSettings)
router.post('/:guild_id/application-commands', checkPermissions, updateApplicationCommands)
router.post('/:guild_id/autovoices/:method', checkPermissions, updateAutoVoices)
router.post('/:guild_id/custom-commands/:method', checkPermissions, updateCustomCommand)
router.post('/:guild_id/interactive-messages/:method', checkPermissions, updateInteractiveMessages)
router.post('/:guild_id/reactions/:method', checkPermissions, updateInteractiveReaction)
router.post('/:guild_id/subscriptions/telegram/:method', checkPermissions, updateTelegramSubscription)
router.post('/:guild_id/subscriptions/twitch/:method', checkPermissions, updateTwitchSubscriptions)
router.post('/:guild_id/subscriptions/youtube/:method', checkPermissions, updateYouTubeSubscriptions)

async function getSettings(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const partial = ctx.request.headers['partial-guild'] as any

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let selfMember: APIGuildMember

    try {
        selfMember = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildMember(guild_id, process.env.DISCORD_CLIENT_ID))) as any
    } catch (err) {}

    if (!selfMember) ctx.throw(406)

    let guildChannels: APIGuildChannel<any>[] = [],
        guildRoles: APIRole[] = [],
        guildEmojis: APIEmoji[] = [],
        selfCommands: APIApplicationCommand[] = []

    try {
        guildChannels = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildChannels(guild_id))) as any
        guildRoles = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildRoles(guild_id))) as any
        guildEmojis = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildEmojis(guild_id))) as any
        selfCommands = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
            query: makeURLSearchParams({ with_localizations: true })
        })) as any
    } catch (err) {}

    const selfRoles = guildRoles
        .sort((a, b) => a.position - b.position)
        .filter(r => selfMember.roles.includes(r.id) || r.tags?.bot_id == process.env.DISCORD_CLIENT_ID)
    const selfHighestRole = selfRoles.length ? selfRoles.reduce((x, y) => (DiscordUtils.compareRolePositions(x, y) ? y : x), selfRoles[0]) : null
    const selfPermissions = selfRoles.reduce((x, y) => x | BigInt(y.permissions), 0n)

    const channels = guildChannels
        .sort((a, b) => (a.parent_id as any) - (b.parent_id as any) || a.position - b.position)
        .map(c => {
            return { id: c.id, name: c.name, parentId: c.parent_id, position: c.position, type: ChannelType[c.type] ?? 'UNKNOWN' }
        })
    const roles = guildRoles
        .filter(r => !r.tags?.bot_id)
        .sort((a, b) => b.position - a.position)
        .map(r => {
            return {
                id: r.id,
                name: r.name,
                color: r.color,
                position: r.position,
                managed: r.managed,
                higher: !selfHighestRole || selfHighestRole.position <= r.position
            }
        })
    const emojis = guildEmojis.map(e => {
        return { id: e.id, name: e.name, animated: e.animated, url: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'png'}` }
    })

    const commandsCache = (await db.qdb.get('commands')) as any
    const { diamondPrices: prices } = await db.json.get()

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        premium: {
            available: server.server.premium.available,
            will_expire_on: server.server.premium.will_expire_on
        },
        server: {
            bot_expert_roles: server.server.bot_expert_roles
        },
        commands: server.commands,
        guild: {
            ...JSON.parse(partial),
            channels,
            roles: roles.filter(r => r.id != guild_id),
            emojis,
            app_permissions: new PermissionsBitField(selfPermissions).toArray(),
            commands: selfCommands
                .filter(i => i.type === 1)
                .map(i => {
                    const commandCache = commandsCache.find(ii => ii.name === i.name)

                    return {
                        name: i.name_localizations?.[server.locale] ?? i.name,
                        description: i.description_localizations?.[server.locale] ?? i.description,
                        group: commandCache?.group ?? 'GENERAL'
                    }
                })
        },
        moderation: {
            case_log: {
                channel_id: server.moderation.case_log.channel_id,
                types: server.moderation.case_log.types
            },
            logs: {
                types: server.moderation.logs.types
            },
            warnings: {
                penalties: server.moderation.warnings.penalties
            },
            automoder: server.moderation.automoder,
            respect_hierarchy: server.moderation.respect_hierarchy,
            deny_moderate_users_with_mp: server.moderation.deny_moderate_users_with_mp,
            unmoderated_roles: server.moderation.unmoderated_roles,
            mutes: {
                rar: server.moderation.mutes.rar,
                rar_strict: server.moderation.mutes.rar_strict
            }
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
            autothreads: server.modules.autothreads,
            autoreactions: server.modules.autoreactions,
            economy: server.modules.economy,
            subscriptions: server.modules.subscriptions,
            interactive_messages: server.modules.interactive_messages,
            activities: server.modules.activities,
            custom_commands: server.modules.custom_commands
        },
        prices,
        change_log: server.change_log.reverse()
    }
}

async function updateSettings(ctx: Context) {
    const guild_id = ctx.params.guild_id
    const user_id = ctx.headers['user-id'] as string
    const data = ctx.request.body as Partial<ServerDocument>

    let server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let selfMember: APIGuildMember

    try {
        selfMember = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildMember(guild_id, process.env.DISCORD_CLIENT_ID))) as any
    } catch (err) {}

    if (!selfMember) ctx.throw(406)

    const { diamondPrices: prices } = await db.json.get()
    server = await interfaces.updateSettings(server, data, user_id)

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        premium: {
            available: server.server.premium.available,
            will_expire_on: server.server.premium.will_expire_on
        },
        server: {
            bot_expert_roles: server.server.bot_expert_roles
        },
        commands: server.commands,
        moderation: {
            case_log: {
                channel_id: server.moderation.case_log.channel_id,
                types: server.moderation.case_log.types
            },
            logs: {
                types: server.moderation.logs.types
            },
            warnings: {
                penalties: server.moderation.warnings.penalties
            },
            automoder: server.moderation.automoder,
            respect_hierarchy: server.moderation.respect_hierarchy,
            deny_moderate_users_with_mp: server.moderation.deny_moderate_users_with_mp,
            unmoderated_roles: server.moderation.unmoderated_roles,
            mutes: {
                rar: server.moderation.mutes.rar,
                rar_strict: server.moderation.mutes.rar_strict
            }
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
            autothreads: server.modules.autothreads,
            autoreactions: server.modules.autoreactions,
            economy: server.modules.economy,
            subscriptions: server.modules.subscriptions,
            interactive_messages: server.modules.interactive_messages,
            activities: server.modules.activities,
            custom_commands: server.modules.custom_commands
        },
        prices,
        change_log: server.change_log.reverse()
    }
}

async function updateApplicationCommands(ctx: Context) {
    const guild_id: string = ctx.params.guild_id

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    try {
        await DiscordUtils.restApi.put(DiscordUtils.apiRoutes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guild_id), {
            body: server.modules.custom_commands.map(i => i.command)
        })
    } catch (err) {
        ctx.throw(500)
    }

    ctx.status = 204
}

async function updateCustomCommand(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await interfaces.createCustomCommand(server, data)
                break

            case 'update':
                response = await interfaces.updateCustomCommand(server, data)
                break

            case 'delete':
                response = await interfaces.deleteCustomCommand(server, data)
                break

            default:
                throw new Error('UNKNOWN_METHOD')
        }
    } catch (err) {
        ctx.throw(400, err.message)
    }

    ctx.status = 200
    ctx.body = response
}

async function updateInteractiveMessages(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    if (!data) ctx.throw(400)

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await interfaces.createInteractiveMessage(server, data)
                break

            case 'update':
                response = await interfaces.updateInteractiveMessage(server, data)
                break

            case 'delete':
                response = await interfaces.deleteInteractiveMessage(server, data)
                break

            default:
                throw new Error('UNKNOWN_METHOD')
        }
    } catch (err) {
        ctx.throw(400, err.message)
    }

    ctx.status = 200
    ctx.body = response
}

async function updateInteractiveReaction(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    if (!data) ctx.throw(400)

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await interfaces.createInteractiveReaction(server, data)
                break

            case 'update':
                response = await interfaces.updateInteractiveReaction(server, data)
                break

            case 'delete':
                response = await interfaces.deleteInteractiveReaction(server, data)
                break

            default:
                throw new Error('UNKNOWN_METHOD')
        }
    } catch (err) {
        ctx.throw(400, err.message)
    }

    ctx.status = 200
    ctx.body = response
}

async function updateTelegramSubscription(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await interfaces.createTelegramSubscription(server, data)
                break

            case 'update':
                response = await interfaces.updateTelegramSubscription(server, data)
                break

            case 'delete':
                response = await interfaces.deleteTelegramSubscription(server, data)
                break

            default:
                throw new Error('UNKNOWN_METHOD')
        }
    } catch (err) {
        ctx.throw(400, err.message)
    }

    ctx.status = 200
    ctx.body = response
}

async function updateTwitchSubscriptions(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await interfaces.createTwitchSubscription(server, data)
                break

            case 'update':
                response = await interfaces.updateTwitchSubscription(server, data)
                break

            case 'delete':
                response = await interfaces.deleteTwitchSubscription(server, data)
                break

            default:
                throw new Error('UNKNOWN_METHOD')
        }
    } catch (err) {
        ctx.throw(400, err.message)
    }

    ctx.status = 200
    ctx.body = response
}

async function updateYouTubeSubscriptions(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await interfaces.createYouTubeSubscription(server, data)
                break

            case 'update':
                response = await interfaces.updateYouTubeSubscription(server, data)
                break

            case 'delete':
                response = await interfaces.deleteYouTubeSubscription(server, data)
                break

            default:
                throw new Error('UNKNOWN_METHOD')
        }
    } catch (err) {
        ctx.throw(400, err.message)
    }

    ctx.status = 200
    ctx.body = response
}

async function updateAutoVoices(ctx: Context) {
    const guild_id: string = ctx.params.guild_id
    const method: string = ctx.params.method
    const data = ctx.request.body

    const server = await db.servers.findOne({ _id: guild_id })
    if (!server || server.server.blocked) ctx.throw(404)

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await interfaces.createAutoVoice(server, data)
                break

            case 'update':
                response = await interfaces.updateAutoVoice(server, data)
                break

            case 'delete':
                response = await interfaces.deleteAutoVoice(server, data)
                break

            default:
                throw new Error('UNKNOWN_METHOD')
        }
    } catch (err) {
        ctx.throw(400, err.message)
    }

    ctx.status = 200
    ctx.body = response
}

export default router
