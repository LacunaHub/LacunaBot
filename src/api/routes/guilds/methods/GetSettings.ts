import {
    APIApplicationCommand,
    APIEmoji,
    APIGuildChannel,
    APIGuildMember,
    APIRole,
    ChannelType,
    PermissionsBitField,
    RESTAPIPartialCurrentUserGuild,
    makeURLSearchParams
} from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import { CommandGroup } from '../../../../internals/structures/Command'
import APIError from '../../../utility/APIError'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function getSettings(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        guild: RESTAPIPartialCurrentUserGuild = ctx.state.guild
    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    let selfMember: APIGuildMember

    try {
        selfMember = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildMember(guildId, process.env.LCN_DISCORD_CLIENT_ID))) as any
    } catch (err) {}

    if (!selfMember) {
        ctx.throw(406, new APIError(2004))
    }

    let guildChannels: APIGuildChannel<any>[] = [],
        guildRoles: APIRole[] = [],
        guildEmojis: APIEmoji[] = [],
        selfCommands: APIApplicationCommand[] = []

    try {
        guildChannels = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildChannels(guildId))) as any
        guildRoles = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildRoles(guildId))) as any
        guildEmojis = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildEmojis(guildId))) as any
        selfCommands = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.applicationCommands(process.env.LCN_DISCORD_CLIENT_ID), {
            query: makeURLSearchParams({ with_localizations: true }) as any
        })) as any
    } catch (err) {}

    const selfRoles = guildRoles
        .sort((a, b) => a.position - b.position)
        .filter(r => selfMember.roles.includes(r.id) || r.tags?.bot_id == process.env.LCN_DISCORD_CLIENT_ID)
    const selfHighestRole = selfRoles.length ? selfRoles.reduce((x, y) => (DiscordUtils.compareRolePositions(x, y) ? y : x), selfRoles[0]) : null
    const selfPermissions = selfRoles.reduce((x, y) => x | BigInt(y.permissions), 0n)

    const channels = guildChannels
        .sort((a, b) => (a.parent_id as any) - (b.parent_id as any) || a.position - b.position)
        .map(c => {
            return {
                id: c.id,
                name: c.name,
                parentId: c.parent_id,
                position: c.position,
                type: ChannelType[c.type] ?? 'UNKNOWN'
            }
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
        return {
            id: e.id,
            name: e.name,
            animated: e.animated,
            url: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'png'}`
        }
    })

    const commandsCache = (await database.qdb.get('commands')) as any

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        premium: server.premium,
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
                        group: CommandGroup[commandCache?.group].toUpperCase()
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
        change_log: server.change_log.reverse()
    }
}
