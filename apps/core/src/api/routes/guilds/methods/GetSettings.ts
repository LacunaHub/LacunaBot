import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { CommandGroup } from '@/internals/structures/Command.js'
import { supportServerId } from '@/internals/utility/Constants.js'
import {
    type APIApplicationCommand,
    type APIAutoModerationRule,
    type APIEmoji,
    type APIGuildChannel,
    type APIGuildMember,
    type APIRole,
    type APISortableChannel,
    ChannelType,
    PermissionsBitField,
    type RESTAPIPartialCurrentUserGuild,
    makeURLSearchParams
} from 'discord.js'
import { type Context } from 'koa'

export default async function getSettings(ctx: Context) {
    const guildId: string = ctx.params.guildId,
        guild: RESTAPIPartialCurrentUserGuild = ctx.state.guild
    const server: ServerDocument = ctx.state.server

    let selfMember!: APIGuildMember

    try {
        selfMember = (await DiscordUtils.rest.get(
            DiscordUtils.restRoutes.guildMember(guildId, process.env.LCN_DISCORD_CLIENT_ID)
        )) as any
    } catch (err) {}

    if (!selfMember) {
        ctx.throw(406, new APIError(2004))
    }

    let guildChannels: (APIGuildChannel & APISortableChannel)[] = [],
        guildRoles: APIRole[] = [],
        guildEmojis: APIEmoji[] = [],
        guildAutoModRules: APIAutoModerationRule[] = [],
        selfCommands: APIApplicationCommand[] = []

    try {
        guildChannels = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildChannels(guildId))) as any
        guildRoles = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildRoles(guildId))) as any
        guildEmojis = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildEmojis(guildId))) as any
        guildAutoModRules = (await DiscordUtils.rest.get(
            DiscordUtils.restRoutes.guildAutoModerationRules(guildId)
        )) as any
        selfCommands = (await DiscordUtils.rest.get(
            DiscordUtils.restRoutes.applicationCommands(process.env.LCN_DISCORD_CLIENT_ID!),
            {
                query: makeURLSearchParams({ with_localizations: true }) as any
            }
        )) as any
    } catch (err) {}

    const selfRoles = guildRoles
        .sort((a, b) => a.position - b.position)
        .filter(r => selfMember.roles.includes(r.id) || r.tags?.bot_id == process.env.LCN_DISCORD_CLIENT_ID)
    const selfHighestRole = selfRoles.length
        ? selfRoles.reduce((x, y) => (DiscordUtils.compareRolePositions(x, y) ? y : x), selfRoles[0]!)
        : null
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
                color: r.colors.primary_color,
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

    const commandsCache = (await database.qdb.get('commands')) as Record<string, any>[]
    const env = await database.getEnv(),
        aiModClosedBetaServerIds = [supportServerId, ...(env.aiClosedBetaServerIds ?? [])]

    if (guildAutoModRules.some(v => !server.moderation.dame_rules.some(vv => v.id === vv.id))) {
        const dameRules = guildAutoModRules.map(v => {
            const dameRule = server.moderation.dame_rules.find(vv => v.id === vv.id)

            return {
                id: v.id,
                name: v.name,
                event_type: v.event_type,
                trigger_type: v.trigger_type,
                trigger_metadata: v.trigger_metadata,
                actions: [...v.actions, ...(dameRule?.actions?.filter(vv => vv.type > 100) ?? [])],
                enabled: v.enabled,
                exempt_roles: v.exempt_roles,
                exempt_channels: v.exempt_channels
            }
        })

        if (dameRules.length) {
            server.moderation.dame_rules = dameRules as any
            await database.servers.updateOne(
                { _id: guildId },
                {
                    $set: {
                        'moderation.dame_rules': dameRules
                    }
                }
            )
        }
    }

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        premium: server.premium,
        bot_experts: server.bot_experts,
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
                        // @ts-ignore
                        name: i.name_localizations?.[server.locale] ?? i.name,
                        // @ts-ignore
                        description: i.description_localizations?.[server.locale] ?? i.description,
                        group: CommandGroup[commandCache?.group]!.toUpperCase()
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
            },
            ai_mod: aiModClosedBetaServerIds.includes(server._id) ? server.moderation.ai_mod : null,
            dame_rules: server.moderation.dame_rules
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
        web_page: server.web_page,
        change_log: server.change_log.reverse()
    }
}
