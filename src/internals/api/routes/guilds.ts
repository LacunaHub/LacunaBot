import Router from '@koa/router'
import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import {
    APIApplicationCommand,
    APIEmoji,
    APIGuildChannel,
    APIGuildMember,
    APIRole,
    APIUser,
    ChannelType,
    makeURLSearchParams,
    PermissionsBitField,
    RESTAPIPartialCurrentUserGuild
} from 'discord.js'
import { Context } from 'koa'
import db from '../../../database'
import { diamondGuilds } from '../../structures/DiamondGuild'
import { addDiamond } from '../../utility/billing'
import DiscordUtils from '../../utility/DiscordUtils'
import DiscordOAuth2 from '../discord/OAuth2'
import interfaces from '../interfaces'
import APIError from '../utility/APIError'
import { authorize, checkPermissions } from '../utility/Authorize'
import { createRateLimitMiddleware } from '../utility/Utils'

const router: Router = new Router({ prefix: '/guilds' })
const OAuth2 = new DiscordOAuth2(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET)

router.get('/:guild_id/settings', createRateLimitMiddleware(10), authorize, checkPermissions, getSettings)
router.post('/:guild_id/settings', createRateLimitMiddleware(10), authorize, checkPermissions, updateSettings)
router.post('/:guild_id/custom-commands/:method', createRateLimitMiddleware(5), authorize, checkPermissions, updateCustomCommand)
router.post('/:guild_id/interactive-messages/:method', createRateLimitMiddleware(5), authorize, checkPermissions, updateInteractiveMessage)
router.post('/:guild_id/reactions/:method', createRateLimitMiddleware(5), authorize, checkPermissions, updateInteractiveReaction)
router.post('/:guild_id/subscriptions/telegram/:method', createRateLimitMiddleware(5), authorize, checkPermissions, updateTelegramSubscription)
router.post('/:guild_id/subscriptions/twitch/:method', createRateLimitMiddleware(5), authorize, checkPermissions, updateTwitchSubscription)
router.post('/:guild_id/subscriptions/youtube/:method', createRateLimitMiddleware(5), authorize, checkPermissions, updateYouTubeSubscription)
router.post('/:guild_id/autovoices/:method', createRateLimitMiddleware(5), authorize, checkPermissions, updateAutoVoice)
router.post('/:guild_id/transfer-diamond/:to_guild_id', createRateLimitMiddleware(1, 1000 * 60 * 5), authorize, transferDiamond)
router.post('/:guild_id/download-logs', createRateLimitMiddleware(5), authorize, checkPermissions, downloadLogs)

async function getSettings(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        guild: RESTAPIPartialCurrentUserGuild = ctx.state.guild
    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    let selfMember: APIGuildMember

    try {
        selfMember = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildMember(guildId, process.env.DISCORD_CLIENT_ID))) as any
    } catch (err) {}

    if (!selfMember) {
        ctx.throw(406, new APIError(2004))
    }

    let guildChannels: APIGuildChannel<any>[] = [],
        guildRoles: APIRole[] = [],
        guildEmojis: APIEmoji[] = [],
        selfCommands: APIApplicationCommand[] = []

    try {
        guildChannels = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildChannels(guildId))) as any
        guildRoles = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildRoles(guildId))) as any
        guildEmojis = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildEmojis(guildId))) as any
        selfCommands = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
            query: makeURLSearchParams({ with_localizations: true }) as any
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
    const { diamondPrices } = await db.getInternalData()

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        premium: {
            available: server.premium.available,
            will_expire_on: server.premium.expires_at
        },
        server: {
            bot_expert_roles: server.bot_experts
        },
        commands: server.commands,
        guild: {
            ...guild,
            channels,
            roles: roles.filter(r => r.id != guildId),
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
            custom_commands: server.modules.custom_commands,
            automation: server.modules.automation,
            guild_image_rotation: server.modules.guild_image_rotation
        },
        prices: diamondPrices,
        change_log: server.change_log.reverse()
    }
}

async function updateSettings(ctx: Context) {
    const guildId: string = ctx.params.guild_id
    const currentUser: Partial<APIUser> = ctx.state.user
    const data: Partial<ServerDocument> = ctx.request.body

    let server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    let selfMember: APIGuildMember

    try {
        selfMember = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildMember(guildId, process.env.DISCORD_CLIENT_ID))) as any
    } catch (err) {}

    if (!selfMember) {
        ctx.throw(406, new APIError(2004))
    }

    const { diamondPrices } = await db.getInternalData()
    server = await interfaces.updateSettings(server, data, currentUser.id)

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        premium: {
            available: server.premium.available,
            will_expire_on: server.premium.expires_at
        },
        server: {
            bot_expert_roles: server.bot_experts
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
            custom_commands: server.modules.custom_commands,
            automation: server.modules.automation,
            guild_image_rotation: server.modules.guild_image_rotation
        },
        prices: diamondPrices,
        change_log: server.change_log.reverse()
    }
}

async function updateCustomCommand(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body
    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

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
                throw new APIError(4012)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

async function updateInteractiveMessage(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body
    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

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
                throw new APIError(4013)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

async function updateInteractiveReaction(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body
    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

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
                throw new APIError(4014)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

async function updateTelegramSubscription(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body
    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

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
                throw new APIError(4015)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

async function updateTwitchSubscription(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body
    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

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
                throw new APIError(4016)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

async function updateYouTubeSubscription(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body

    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

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
                throw new APIError(4017)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

async function updateAutoVoice(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body

    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

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
                throw new APIError(4018)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

async function transferDiamond(ctx: Context) {
    const guildId = ctx.params.guild_id,
        toGuildId = ctx.params.to_guild_id

    let userGuilds: RESTAPIPartialCurrentUserGuild[] = []

    try {
        userGuilds = await OAuth2.getUserGuilds(ctx.request.headers.authorization)
    } catch (err) {
        ctx.throw(400, new APIError(5001))
    }

    const isGuildOwner = userGuilds.filter(i => [guildId, toGuildId].includes(i.id)).every(i => i.owner)

    if (!isGuildOwner) {
        ctx.throw(403, new APIError(4002))
    }

    const server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) ctx.throw(404, new APIError(1003))
    if (!server.premium.available || !server.premium.bill_id) ctx.throw(402, new APIError(2001))

    const bill = await db.bills.findOne({ _id: server.premium.bill_id })

    if (!bill) {
        ctx.throw(400, new APIError(1018))
    }

    const toServer = await db.servers.findOne({ _id: toGuildId })

    if (!toServer || toServer.blocked) ctx.throw(404, new APIError(1003))
    if (toServer.premium.available) ctx.throw(404, new APIError(2009))

    await db.servers.updateOne(
        { _id: guildId },
        {
            $set: {
                'server.premium.available': false,
                'server.premium.will_expire_on': 0,
                'server.premium.bill_id': null
            }
        }
    )

    await db.bills.updateOne(
        { _id: server.premium.bill_id },
        {
            $set: {
                'custom_fields.reference_id': toGuildId
            }
        }
    )

    bill.custom_fields.reference_id = toGuildId
    const diamondGuild = diamondGuilds.get(guildId)

    if (diamondGuild) {
        diamondGuild.cancel()
    }

    await addDiamond(bill)

    ctx.status = 204
}

async function downloadLogs(ctx: Context) {
    const guildId = ctx.params.guild_id,
        server = await db.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const fileName = `${guildId}-${new Date().toISOString()}.log`
    const fileData = server.logs
        .map(i => `[${i.level}: ${new Date(i.timestamp).toISOString()}] - [${i.module}${i.action ?? ''}] ${i.message}`)
        .join('\n')

    ctx.status = 200
    ctx.body = {
        file_name: fileName,
        data: fileData
    }
}

export default router
