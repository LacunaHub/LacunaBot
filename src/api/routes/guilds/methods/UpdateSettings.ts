import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { APIGuildMember, APIUser, parseEmoji } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import { lavalinkSources } from '../../../../internals/utility/Constants'
import { dotNotateObject } from '../../../../internals/utility/Utils'
import { borderRadiuses, textAligns, textDecorations, textSizes, textStyles, textTransforms } from '../../../../modules/ImageGenerator'
import APIError from '../../../utility/APIError'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function updateSettings(ctx: Context) {
    const guildId: string = ctx.params.guildId
    const currentUser: Partial<APIUser> = ctx.state.user
    const data: Partial<ServerDocument> = ctx.request.body

    let server: ServerDocument = ctx.state.server
    let selfMember: APIGuildMember

    try {
        selfMember = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildMember(guildId, process.env.LCN_DISCORD_CLIENT_ID))) as any
    } catch (err) {}

    if (!selfMember) {
        ctx.throw(406, new APIError(2004))
    }

    server = await setSettings(server, data, currentUser.id)

    ctx.status = 200
    ctx.body = {
        _id: server._id,
        locale: server.locale,
        premium: server.premium,
        bot_experts: server.bot_experts,
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
        web_page: server.web_page,
        change_log: server.change_log.reverse()
    }
}

export async function setSettings(guild: ServerDocument, data: Partial<ServerDocument>, user_id: string): Promise<ServerDocument> {
    const updateData = {}

    if (typeof data.locale === 'string' && data.locale !== guild.locale) {
        if (['en', 'ru', 'uk'].includes(data.locale)) {
            updateData['locale'] = data.locale
        }
    }

    if (Array.isArray(data.bot_experts) && JSON.stringify(data.bot_experts) !== JSON.stringify(guild.bot_experts)) {
        updateData['bot_experts'] = data.bot_experts
    }

    if (data.commands) {
        if (
            Array.isArray(data.commands.configuration) &&
            JSON.stringify(data.commands.configuration) !== JSON.stringify(guild.commands.configuration)
        ) {
            updateData['commands.configuration'] = data.commands.configuration
        }
    }

    if (data.moderation) {
        if (typeof data.moderation.respect_hierarchy === 'boolean' && data.moderation.respect_hierarchy !== guild.moderation.respect_hierarchy) {
            updateData['moderation.respect_hierarchy'] = data.moderation.respect_hierarchy
        }

        if (
            typeof data.moderation.deny_moderate_users_with_mp === 'boolean' &&
            data.moderation.deny_moderate_users_with_mp !== guild.moderation.deny_moderate_users_with_mp
        ) {
            updateData['moderation.deny_moderate_users_with_mp'] = data.moderation.deny_moderate_users_with_mp
        }

        if (
            Array.isArray(data.moderation.unmoderated_roles) &&
            JSON.stringify(data.moderation.unmoderated_roles) !== JSON.stringify(guild.moderation.unmoderated_roles)
        ) {
            updateData['moderation.unmoderated_roles'] = data.moderation.unmoderated_roles
        }

        if (data.moderation.case_log) {
            if (
                (typeof data.moderation.case_log.channel_id === 'string' || data.moderation.case_log.channel_id === null) &&
                data.moderation.case_log.channel_id !== guild.moderation.case_log.channel_id
            ) {
                updateData['moderation.case_log.channel_id'] = data.moderation.case_log.channel_id
            }

            if (typeof data.moderation.case_log.types === 'object' && data.moderation.case_log.types !== null) {
                for (const type of Object.keys(data.moderation.case_log.types)) {
                    const current = data.moderation.case_log.types[type]
                    const previous = guild.moderation.case_log.types[type]

                    if (JSON.stringify(current) !== JSON.stringify(previous)) {
                        const caseLogTypeData = {
                            active: current.active ?? previous.active,
                            channel_id: current.channel_id ?? previous.channel_id
                        }

                        if (typeof previous.custom_dm_message !== 'undefined') {
                            caseLogTypeData['custom_dm_message'] = current.custom_dm_message ?? previous.custom_dm_message
                        }

                        if (typeof previous.dm_message !== 'undefined') {
                            caseLogTypeData['dm_message'] = {
                                content: current.dm_message?.content ?? previous.dm_message.content,
                                embed: {
                                    active: current.dm_message?.embed?.active ?? previous.dm_message.embed.active,
                                    title:
                                        typeof current.dm_message?.embed?.title === 'undefined'
                                            ? previous.dm_message.embed.title
                                            : current.dm_message.embed.title,
                                    description:
                                        typeof current.dm_message?.embed?.description === 'undefined'
                                            ? previous.dm_message.embed.description
                                            : current.dm_message.embed.description,
                                    url:
                                        typeof current.dm_message?.embed?.url === 'undefined'
                                            ? previous.dm_message.embed.url
                                            : current.dm_message.embed.url,
                                    timestamp:
                                        typeof current.dm_message?.embed?.timestamp === 'undefined'
                                            ? previous.dm_message.embed.timestamp
                                            : current.dm_message.embed.timestamp,
                                    color:
                                        typeof current.dm_message?.embed?.color === 'undefined'
                                            ? previous.dm_message.embed.color
                                            : current.dm_message.embed.color,
                                    footer: {
                                        text:
                                            typeof current.dm_message?.embed?.footer?.text === 'undefined'
                                                ? previous.dm_message.embed.footer.text
                                                : current.dm_message.embed.footer.text,
                                        icon_url:
                                            typeof current.dm_message?.embed?.footer?.icon_url === 'undefined'
                                                ? previous.dm_message.embed.footer.icon_url
                                                : current.dm_message.embed.footer.icon_url
                                    },
                                    image: {
                                        url:
                                            typeof current.dm_message?.embed?.image?.url === 'undefined'
                                                ? previous.dm_message.embed.image.url
                                                : current.dm_message.embed.image.url
                                    },
                                    thumbnail: {
                                        url:
                                            typeof current.dm_message?.embed?.thumbnail?.url === 'undefined'
                                                ? previous.dm_message.embed.thumbnail.url
                                                : current.dm_message.embed.thumbnail.url
                                    },
                                    author: {
                                        name:
                                            typeof current.dm_message?.embed?.author?.name === 'undefined'
                                                ? previous.dm_message.embed.author.name
                                                : current.dm_message.embed.author.name,
                                        url:
                                            typeof current.dm_message?.embed?.author?.url === 'undefined'
                                                ? previous.dm_message.embed.author.url
                                                : current.dm_message.embed.author.url,
                                        icon_url:
                                            typeof current.dm_message?.embed?.author?.icon_url === 'undefined'
                                                ? previous.dm_message.embed.author.icon_url
                                                : current.dm_message.embed.author.icon_url
                                    },
                                    fields: current.dm_message?.embed?.fields ?? previous.dm_message.embed.fields
                                }
                            }
                        }

                        updateData[`moderation.case_log.types.${type}`] = caseLogTypeData
                    }
                }
            }
        }

        if (data.moderation.logs) {
            if (typeof data.moderation.logs.types === 'object' && data.moderation.logs.types !== null) {
                const dataLogs = Object.keys(data.moderation.logs.types)

                for (const log of dataLogs) {
                    const current = data.moderation.logs.types[log],
                        previous = guild.moderation.logs.types[log]

                    if (
                        (typeof current.active === 'boolean' && current.active !== previous.active) ||
                        ((typeof current.channel_id === 'string' || typeof current.channel_id === null) && current.channel_id !== previous.channel_id)
                    ) {
                        updateData[`moderation.logs.types.${log}`] = {
                            active: Boolean(current.active ?? previous.active),
                            channel_id: current.channel_id ?? previous.channel_id
                        }
                    }
                }
            }
        }

        if (data.moderation.warnings) {
            if (
                Array.isArray(data.moderation.warnings.penalties) &&
                JSON.stringify(data.moderation.warnings.penalties) !== JSON.stringify(guild.moderation.warnings.penalties)
            ) {
                updateData['moderation.warnings.penalties'] = data.moderation.warnings.penalties.slice(0, 100)
            }
        }

        if (data.moderation.automoder) {
            if (data.moderation.automoder.anti_caps) {
                if (
                    typeof data.moderation.automoder.anti_caps.active === 'boolean' &&
                    data.moderation.automoder.anti_caps.active !== guild.moderation.automoder.anti_caps.active
                ) {
                    updateData['moderation.automoder.anti_caps.active'] = data.moderation.automoder.anti_caps.active
                }

                if (
                    typeof data.moderation.automoder.anti_caps.percentage_of_caps === 'number' &&
                    data.moderation.automoder.anti_caps.percentage_of_caps !== guild.moderation.automoder.anti_caps.percentage_of_caps
                ) {
                    if (
                        data.moderation.automoder.anti_caps.percentage_of_caps >= 1 &&
                        data.moderation.automoder.anti_caps.percentage_of_caps <= 100
                    ) {
                        updateData['moderation.automoder.anti_caps.percentage_of_caps'] = data.moderation.automoder.anti_caps.percentage_of_caps
                    }
                }

                if (
                    typeof data.moderation.automoder.anti_caps.minimum_content_length === 'number' &&
                    data.moderation.automoder.anti_caps.minimum_content_length !== guild.moderation.automoder.anti_caps.minimum_content_length
                ) {
                    updateData['moderation.automoder.anti_caps.minimum_content_length'] = data.moderation.automoder.anti_caps.minimum_content_length
                }

                if (
                    Array.isArray(data.moderation.automoder.anti_caps.options) &&
                    JSON.stringify(data.moderation.automoder.anti_caps.options) !== JSON.stringify(guild.moderation.automoder.anti_caps.options)
                ) {
                    updateData['moderation.automoder.anti_caps.options'] = data.moderation.automoder.anti_caps.options
                }

                if (
                    typeof data.moderation.automoder.anti_caps.ban_timeout === 'number' &&
                    data.moderation.automoder.anti_caps.ban_timeout !== guild.moderation.automoder.anti_caps.ban_timeout
                ) {
                    updateData['moderation.automoder.anti_caps.ban_timeout'] = data.moderation.automoder.anti_caps.ban_timeout
                }

                if (
                    typeof data.moderation.automoder.anti_caps.mute_timeout === 'number' &&
                    data.moderation.automoder.anti_caps.mute_timeout !== guild.moderation.automoder.anti_caps.mute_timeout
                ) {
                    updateData['moderation.automoder.anti_caps.mute_timeout'] = data.moderation.automoder.anti_caps.mute_timeout
                }

                if (data.moderation.automoder.anti_caps.modify_roles) {
                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.modify_roles.add) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.modify_roles.add) !==
                            JSON.stringify(guild.moderation.automoder.anti_caps.modify_roles.add)
                    ) {
                        updateData['moderation.automoder.anti_caps.modify_roles.add'] = data.moderation.automoder.anti_caps.modify_roles.add
                    }

                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.modify_roles.remove) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.modify_roles.remove) !==
                            JSON.stringify(guild.moderation.automoder.anti_caps.modify_roles.remove)
                    ) {
                        updateData['moderation.automoder.anti_caps.modify_roles.remove'] = data.moderation.automoder.anti_caps.modify_roles.remove
                    }
                }

                if (data.moderation.automoder.anti_caps.send_message) {
                    if (
                        typeof data.moderation.automoder.anti_caps.send_message.content === 'string' &&
                        data.moderation.automoder.anti_caps.send_message.content !== guild.moderation.automoder.anti_caps.send_message.content
                    ) {
                        updateData['moderation.automoder.anti_caps.send_message.content'] = data.moderation.automoder.anti_caps.send_message.content
                    }

                    if (data.moderation.automoder.anti_caps.send_message.embed) {
                        const newEmbed = data.moderation.automoder.anti_caps.send_message.embed
                        const oldEmbed = guild.moderation.automoder.anti_caps.send_message.embed

                        if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                            updateData['moderation.automoder.anti_caps.send_message.embed'] = {
                                active: newEmbed.active ?? oldEmbed.active,
                                title: typeof newEmbed.title == 'undefined' ? oldEmbed.title : newEmbed.title,
                                description: typeof newEmbed.description == 'undefined' ? oldEmbed.description : newEmbed.description,
                                url: typeof newEmbed.url == 'undefined' ? oldEmbed.url : newEmbed.url,
                                timestamp: typeof newEmbed.timestamp == 'undefined' ? oldEmbed.timestamp : newEmbed.timestamp,
                                color: typeof newEmbed.color == 'undefined' ? oldEmbed.color : newEmbed.color,
                                footer: {
                                    text: typeof newEmbed.footer?.text == 'undefined' ? oldEmbed.footer.text : newEmbed.footer.text,
                                    icon_url: typeof newEmbed.footer?.icon_url == 'undefined' ? oldEmbed.footer.icon_url : newEmbed.footer.icon_url
                                },
                                image: {
                                    url: typeof newEmbed.image?.url == 'undefined' ? oldEmbed.image.url : newEmbed.image.url
                                },
                                thumbnail: {
                                    url: typeof newEmbed.thumbnail?.url == 'undefined' ? oldEmbed.thumbnail.url : newEmbed.thumbnail.url
                                },
                                author: {
                                    name: typeof newEmbed.author?.name == 'undefined' ? oldEmbed.author.name : newEmbed.author.name,
                                    url: typeof newEmbed.author?.url == 'undefined' ? oldEmbed.author.url : newEmbed.author.url,
                                    icon_url: typeof newEmbed.author?.icon_url == 'undefined' ? oldEmbed.author.icon_url : newEmbed.author.icon_url
                                },
                                fields: newEmbed.fields ?? oldEmbed.fields
                            }
                        }
                    }
                }

                if (data.moderation.automoder.anti_caps.ignored) {
                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.ignored.channels) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.ignored.channels) !==
                            JSON.stringify(guild.moderation.automoder.anti_caps.ignored.channels)
                    ) {
                        updateData['moderation.automoder.anti_caps.ignored.channels'] = data.moderation.automoder.anti_caps.ignored.channels
                    }

                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.ignored.roles) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.ignored.roles) !==
                            JSON.stringify(guild.moderation.automoder.anti_caps.ignored.roles)
                    ) {
                        updateData['moderation.automoder.anti_caps.ignored.roles'] = data.moderation.automoder.anti_caps.ignored.roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.ignored.permissions) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.ignored.permissions) !==
                            JSON.stringify(guild.moderation.automoder.anti_caps.ignored.permissions)
                    ) {
                        updateData['moderation.automoder.anti_caps.ignored.permissions'] = data.moderation.automoder.anti_caps.ignored.permissions
                    }
                }
            }

            if (data.moderation.automoder.links_filter) {
                if (
                    typeof data.moderation.automoder.links_filter.active === 'boolean' &&
                    data.moderation.automoder.links_filter.active !== guild.moderation.automoder.links_filter.active
                ) {
                    updateData['moderation.automoder.links_filter.active'] = data.moderation.automoder.links_filter.active
                }

                if (
                    Array.isArray(data.moderation.automoder.links_filter.allowed_registry) &&
                    JSON.stringify(data.moderation.automoder.links_filter.allowed_registry) !==
                        JSON.stringify(guild.moderation.automoder.links_filter.allowed_registry)
                ) {
                    updateData['moderation.automoder.links_filter.allowed_registry'] = data.moderation.automoder.links_filter.allowed_registry
                }

                if (
                    Array.isArray(data.moderation.automoder.links_filter.blocked_registry) &&
                    JSON.stringify(data.moderation.automoder.links_filter.blocked_registry) !==
                        JSON.stringify(guild.moderation.automoder.links_filter.blocked_registry)
                ) {
                    updateData['moderation.automoder.links_filter.blocked_registry'] = data.moderation.automoder.links_filter.blocked_registry
                }

                if (
                    Array.isArray(data.moderation.automoder.links_filter.options) &&
                    JSON.stringify(data.moderation.automoder.links_filter.options) !== JSON.stringify(guild.moderation.automoder.links_filter.options)
                ) {
                    updateData['moderation.automoder.links_filter.options'] = data.moderation.automoder.links_filter.options
                }

                if (
                    typeof data.moderation.automoder.links_filter.ban_timeout === 'number' &&
                    data.moderation.automoder.links_filter.ban_timeout !== guild.moderation.automoder.links_filter.ban_timeout
                ) {
                    updateData['moderation.automoder.links_filter.ban_timeout'] = data.moderation.automoder.links_filter.ban_timeout
                }

                if (
                    typeof data.moderation.automoder.links_filter.mute_timeout === 'number' &&
                    data.moderation.automoder.links_filter.mute_timeout !== guild.moderation.automoder.links_filter.mute_timeout
                ) {
                    updateData['moderation.automoder.links_filter.mute_timeout'] = data.moderation.automoder.links_filter.mute_timeout
                }

                if (data.moderation.automoder.links_filter.modify_roles) {
                    if (
                        Array.isArray(data.moderation.automoder.links_filter.modify_roles.add) &&
                        JSON.stringify(data.moderation.automoder.links_filter.modify_roles.add) !==
                            JSON.stringify(guild.moderation.automoder.links_filter.modify_roles.add)
                    ) {
                        updateData['moderation.automoder.links_filter.modify_roles.add'] = data.moderation.automoder.links_filter.modify_roles.add
                    }

                    if (
                        Array.isArray(data.moderation.automoder.links_filter.modify_roles.remove) &&
                        JSON.stringify(data.moderation.automoder.links_filter.modify_roles.remove) !==
                            JSON.stringify(guild.moderation.automoder.links_filter.modify_roles.remove)
                    ) {
                        updateData['moderation.automoder.links_filter.modify_roles.remove'] =
                            data.moderation.automoder.links_filter.modify_roles.remove
                    }
                }

                if (data.moderation.automoder.links_filter.send_message) {
                    if (
                        typeof data.moderation.automoder.links_filter.send_message.content === 'string' &&
                        data.moderation.automoder.links_filter.send_message.content !== guild.moderation.automoder.links_filter.send_message.content
                    ) {
                        updateData['moderation.automoder.links_filter.send_message.content'] =
                            data.moderation.automoder.links_filter.send_message.content
                    }

                    if (data.moderation.automoder.links_filter.send_message.embed) {
                        const newEmbed = data.moderation.automoder.links_filter.send_message.embed
                        const oldEmbed = guild.moderation.automoder.links_filter.send_message.embed

                        if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                            updateData['moderation.automoder.links_filter.send_message.embed'] = {
                                active: newEmbed.active ?? oldEmbed.active,
                                title: typeof newEmbed.title == 'undefined' ? oldEmbed.title : newEmbed.title,
                                description: typeof newEmbed.description == 'undefined' ? oldEmbed.description : newEmbed.description,
                                url: typeof newEmbed.url == 'undefined' ? oldEmbed.url : newEmbed.url,
                                timestamp: typeof newEmbed.timestamp == 'undefined' ? oldEmbed.timestamp : newEmbed.timestamp,
                                color: typeof newEmbed.color == 'undefined' ? oldEmbed.color : newEmbed.color,
                                footer: {
                                    text: typeof newEmbed.footer?.text == 'undefined' ? oldEmbed.footer.text : newEmbed.footer.text,
                                    icon_url: typeof newEmbed.footer?.icon_url == 'undefined' ? oldEmbed.footer.icon_url : newEmbed.footer.icon_url
                                },
                                image: {
                                    url: typeof newEmbed.image?.url == 'undefined' ? oldEmbed.image.url : newEmbed.image.url
                                },
                                thumbnail: {
                                    url: typeof newEmbed.thumbnail?.url == 'undefined' ? oldEmbed.thumbnail.url : newEmbed.thumbnail.url
                                },
                                author: {
                                    name: typeof newEmbed.author?.name == 'undefined' ? oldEmbed.author.name : newEmbed.author.name,
                                    url: typeof newEmbed.author?.url == 'undefined' ? oldEmbed.author.url : newEmbed.author.url,
                                    icon_url: typeof newEmbed.author?.icon_url == 'undefined' ? oldEmbed.author.icon_url : newEmbed.author.icon_url
                                },
                                fields: newEmbed.fields ?? oldEmbed.fields
                            }
                        }
                    }
                }

                if (data.moderation.automoder.links_filter.ignored) {
                    if (
                        Array.isArray(data.moderation.automoder.links_filter.ignored.channels) &&
                        JSON.stringify(data.moderation.automoder.links_filter.ignored.channels) !==
                            JSON.stringify(guild.moderation.automoder.links_filter.ignored.channels)
                    ) {
                        updateData['moderation.automoder.links_filter.ignored.channels'] = data.moderation.automoder.links_filter.ignored.channels
                    }

                    if (
                        Array.isArray(data.moderation.automoder.links_filter.ignored.roles) &&
                        JSON.stringify(data.moderation.automoder.links_filter.ignored.roles) !==
                            JSON.stringify(guild.moderation.automoder.links_filter.ignored.roles)
                    ) {
                        updateData['moderation.automoder.links_filter.ignored.roles'] = data.moderation.automoder.links_filter.ignored.roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.links_filter.ignored.permissions) &&
                        JSON.stringify(data.moderation.automoder.links_filter.ignored.permissions) !==
                            JSON.stringify(guild.moderation.automoder.links_filter.ignored.permissions)
                    ) {
                        updateData['moderation.automoder.links_filter.ignored.permissions'] =
                            data.moderation.automoder.links_filter.ignored.permissions
                    }
                }
            }

            if (data.moderation.automoder.nicknames) {
                if (
                    typeof data.moderation.automoder.nicknames.active === 'boolean' &&
                    data.moderation.automoder.nicknames.active !== guild.moderation.automoder.nicknames.active
                ) {
                    updateData['moderation.automoder.nicknames.active'] = data.moderation.automoder.nicknames.active
                }

                if (
                    Array.isArray(data.moderation.automoder.nicknames.options) &&
                    JSON.stringify(data.moderation.automoder.nicknames.options) !== JSON.stringify(guild.moderation.automoder.nicknames.options)
                ) {
                    updateData['moderation.automoder.nicknames.options'] = data.moderation.automoder.nicknames.options
                }

                if (
                    Array.isArray(data.moderation.automoder.nicknames.contains) &&
                    JSON.stringify(data.moderation.automoder.nicknames.contains) !== JSON.stringify(guild.moderation.automoder.nicknames.contains)
                ) {
                    updateData['moderation.automoder.nicknames.contains'] = data.moderation.automoder.nicknames.contains
                }

                if (data.moderation.automoder.nicknames.ignored) {
                    if (
                        Array.isArray(data.moderation.automoder.nicknames.ignored.roles) &&
                        JSON.stringify(data.moderation.automoder.nicknames.ignored.roles) !==
                            JSON.stringify(guild.moderation.automoder.nicknames.ignored.roles)
                    ) {
                        updateData['moderation.automoder.nicknames.ignored.roles'] = data.moderation.automoder.nicknames.ignored.roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.nicknames.ignored.permissions) &&
                        JSON.stringify(data.moderation.automoder.nicknames.ignored.permissions) !==
                            JSON.stringify(guild.moderation.automoder.nicknames.ignored.permissions)
                    ) {
                        updateData['moderation.automoder.nicknames.ignored.permissions'] = data.moderation.automoder.nicknames.ignored.permissions
                    }

                    if (
                        typeof data.moderation.automoder.nicknames.ignored.bots === 'boolean' &&
                        data.moderation.automoder.nicknames.ignored.bots !== guild.moderation.automoder.nicknames.ignored.bots
                    ) {
                        updateData['moderation.automoder.nicknames.ignored.bots'] = data.moderation.automoder.nicknames.ignored.bots
                    }
                }
            }

            if (data.moderation.automoder.newbies) {
                if (
                    typeof data.moderation.automoder.newbies.active === 'boolean' &&
                    data.moderation.automoder.newbies.active !== guild.moderation.automoder.newbies.active
                ) {
                    updateData['moderation.automoder.newbies.active'] = data.moderation.automoder.newbies.active
                }

                if (
                    typeof data.moderation.automoder.newbies.minimum_account_age?.value === 'number' &&
                    data.moderation.automoder.newbies.minimum_account_age.value !== guild.moderation.automoder.newbies.minimum_account_age.value
                ) {
                    updateData['moderation.automoder.newbies.minimum_account_age.value'] = data.moderation.automoder.newbies.minimum_account_age.value
                }

                if (
                    typeof data.moderation.automoder.newbies.minimum_account_age?.measure === 'string' &&
                    data.moderation.automoder.newbies.minimum_account_age.measure !==
                        guild.moderation.automoder.newbies.minimum_account_age.measure &&
                    ['MINUTES', 'HOURS', 'DAYS'].includes(data.moderation.automoder.newbies.minimum_account_age.measure)
                ) {
                    updateData['moderation.automoder.newbies.minimum_account_age.measure'] =
                        data.moderation.automoder.newbies.minimum_account_age.measure
                }

                if (
                    Array.isArray(data.moderation.automoder.newbies.options) &&
                    JSON.stringify(data.moderation.automoder.newbies.options) !== JSON.stringify(guild.moderation.automoder.newbies.options)
                ) {
                    updateData['moderation.automoder.newbies.options'] = data.moderation.automoder.newbies.options
                }

                if (
                    typeof data.moderation.automoder.newbies.ban_timeout === 'number' &&
                    data.moderation.automoder.newbies.ban_timeout !== guild.moderation.automoder.newbies.ban_timeout
                ) {
                    updateData['moderation.automoder.newbies.ban_timeout'] = data.moderation.automoder.newbies.ban_timeout
                }

                if (
                    typeof data.moderation.automoder.newbies.mute_timeout === 'number' &&
                    data.moderation.automoder.newbies.mute_timeout !== guild.moderation.automoder.newbies.mute_timeout
                ) {
                    updateData['moderation.automoder.newbies.mute_timeout'] = data.moderation.automoder.newbies.mute_timeout
                }

                if (data.moderation.automoder.newbies.modify_roles) {
                    if (
                        Array.isArray(data.moderation.automoder.newbies.modify_roles.add) &&
                        JSON.stringify(data.moderation.automoder.newbies.modify_roles.add) !==
                            JSON.stringify(guild.moderation.automoder.newbies.modify_roles.add)
                    ) {
                        updateData['moderation.automoder.newbies.modify_roles.add'] = data.moderation.automoder.newbies.modify_roles.add
                    }

                    if (
                        Array.isArray(data.moderation.automoder.newbies.modify_roles.remove) &&
                        JSON.stringify(data.moderation.automoder.newbies.modify_roles.remove) !==
                            JSON.stringify(guild.moderation.automoder.newbies.modify_roles.remove)
                    ) {
                        updateData['moderation.automoder.newbies.modify_roles.remove'] = data.moderation.automoder.newbies.modify_roles.remove
                    }
                }
            }

            if (data.moderation.automoder.swear_filter) {
                if (
                    typeof data.moderation.automoder.swear_filter.active === 'boolean' &&
                    data.moderation.automoder.swear_filter.active !== guild.moderation.automoder.swear_filter.active
                ) {
                    updateData['moderation.automoder.swear_filter.active'] = data.moderation.automoder.swear_filter.active
                }

                if (
                    Array.isArray(data.moderation.automoder.swear_filter.registry) &&
                    JSON.stringify(data.moderation.automoder.swear_filter.registry) !==
                        JSON.stringify(guild.moderation.automoder.swear_filter.registry)
                ) {
                    updateData['moderation.automoder.swear_filter.registry'] = data.moderation.automoder.swear_filter.registry
                }

                if (
                    Array.isArray(data.moderation.automoder.swear_filter.options) &&
                    JSON.stringify(data.moderation.automoder.swear_filter.options) !== JSON.stringify(guild.moderation.automoder.swear_filter.options)
                ) {
                    updateData['moderation.automoder.swear_filter.options'] = data.moderation.automoder.swear_filter.options
                }

                if (
                    typeof data.moderation.automoder.swear_filter.ban_timeout === 'number' &&
                    data.moderation.automoder.swear_filter.ban_timeout !== guild.moderation.automoder.swear_filter.ban_timeout
                ) {
                    updateData['moderation.automoder.swear_filter.ban_timeout'] = data.moderation.automoder.swear_filter.ban_timeout
                }

                if (
                    typeof data.moderation.automoder.swear_filter.mute_timeout === 'number' &&
                    data.moderation.automoder.swear_filter.mute_timeout !== guild.moderation.automoder.swear_filter.mute_timeout
                ) {
                    updateData['moderation.automoder.swear_filter.mute_timeout'] = data.moderation.automoder.swear_filter.mute_timeout
                }

                if (data.moderation.automoder.swear_filter.modify_roles) {
                    if (
                        Array.isArray(data.moderation.automoder.swear_filter.modify_roles.add) &&
                        JSON.stringify(data.moderation.automoder.swear_filter.modify_roles.add) !==
                            JSON.stringify(guild.moderation.automoder.swear_filter.modify_roles.add)
                    ) {
                        updateData['moderation.automoder.swear_filter.modify_roles.add'] = data.moderation.automoder.swear_filter.modify_roles.add
                    }

                    if (
                        Array.isArray(data.moderation.automoder.swear_filter.modify_roles.remove) &&
                        JSON.stringify(data.moderation.automoder.swear_filter.modify_roles.remove) !==
                            JSON.stringify(guild.moderation.automoder.swear_filter.modify_roles.remove)
                    ) {
                        updateData['moderation.automoder.swear_filter.modify_roles.remove'] =
                            data.moderation.automoder.swear_filter.modify_roles.remove
                    }
                }

                if (data.moderation.automoder.swear_filter.send_message) {
                    if (
                        typeof data.moderation.automoder.swear_filter.send_message.content === 'string' &&
                        data.moderation.automoder.swear_filter.send_message.content !== guild.moderation.automoder.swear_filter.send_message.content
                    ) {
                        updateData['moderation.automoder.swear_filter.send_message.content'] =
                            data.moderation.automoder.swear_filter.send_message.content
                    }

                    if (data.moderation.automoder.swear_filter.send_message.embed) {
                        const newEmbed = data.moderation.automoder.swear_filter.send_message.embed
                        const oldEmbed = guild.moderation.automoder.swear_filter.send_message.embed

                        if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                            updateData['moderation.automoder.swear_filter.send_message.embed'] = {
                                active: newEmbed.active ?? oldEmbed.active,
                                title: typeof newEmbed.title == 'undefined' ? oldEmbed.title : newEmbed.title,
                                description: typeof newEmbed.description == 'undefined' ? oldEmbed.description : newEmbed.description,
                                url: typeof newEmbed.url == 'undefined' ? oldEmbed.url : newEmbed.url,
                                timestamp: typeof newEmbed.timestamp == 'undefined' ? oldEmbed.timestamp : newEmbed.timestamp,
                                color: typeof newEmbed.color == 'undefined' ? oldEmbed.color : newEmbed.color,
                                footer: {
                                    text: typeof newEmbed.footer?.text == 'undefined' ? oldEmbed.footer.text : newEmbed.footer.text,
                                    icon_url: typeof newEmbed.footer?.icon_url == 'undefined' ? oldEmbed.footer.icon_url : newEmbed.footer.icon_url
                                },
                                image: {
                                    url: typeof newEmbed.image?.url == 'undefined' ? oldEmbed.image.url : newEmbed.image.url
                                },
                                thumbnail: {
                                    url: typeof newEmbed.thumbnail?.url == 'undefined' ? oldEmbed.thumbnail.url : newEmbed.thumbnail.url
                                },
                                author: {
                                    name: typeof newEmbed.author?.name == 'undefined' ? oldEmbed.author.name : newEmbed.author.name,
                                    url: typeof newEmbed.author?.url == 'undefined' ? oldEmbed.author.url : newEmbed.author.url,
                                    icon_url: typeof newEmbed.author?.icon_url == 'undefined' ? oldEmbed.author.icon_url : newEmbed.author.icon_url
                                },
                                fields: newEmbed.fields ?? oldEmbed.fields
                            }
                        }
                    }
                }

                if (data.moderation.automoder.swear_filter.ignored) {
                    if (
                        Array.isArray(data.moderation.automoder.swear_filter.ignored.channels) &&
                        JSON.stringify(data.moderation.automoder.swear_filter.ignored.channels) !==
                            JSON.stringify(guild.moderation.automoder.swear_filter.ignored.channels)
                    ) {
                        updateData['moderation.automoder.swear_filter.ignored.channels'] = data.moderation.automoder.swear_filter.ignored.channels
                    }

                    if (
                        Array.isArray(data.moderation.automoder.swear_filter.ignored.roles) &&
                        JSON.stringify(data.moderation.automoder.swear_filter.ignored.roles) !==
                            JSON.stringify(guild.moderation.automoder.swear_filter.ignored.roles)
                    ) {
                        updateData['moderation.automoder.swear_filter.ignored.roles'] = data.moderation.automoder.swear_filter.ignored.roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.swear_filter.ignored.permissions) &&
                        JSON.stringify(data.moderation.automoder.swear_filter.ignored.permissions) !==
                            JSON.stringify(guild.moderation.automoder.swear_filter.ignored.permissions)
                    ) {
                        updateData['moderation.automoder.swear_filter.ignored.permissions'] =
                            data.moderation.automoder.swear_filter.ignored.permissions
                    }
                }
            }

            if (data.moderation.automoder.users_slowdown) {
                if (
                    typeof data.moderation.automoder.users_slowdown.active === 'boolean' &&
                    data.moderation.automoder.users_slowdown.active !== guild.moderation.automoder.users_slowdown.active
                ) {
                    updateData['moderation.automoder.users_slowdown.active'] = data.moderation.automoder.users_slowdown.active
                }

                if (
                    typeof data.moderation.automoder.users_slowdown.messages_limit === 'number' &&
                    data.moderation.automoder.users_slowdown.messages_limit !== guild.moderation.automoder.users_slowdown.messages_limit
                ) {
                    updateData['moderation.automoder.users_slowdown.messages_limit'] = data.moderation.automoder.users_slowdown.messages_limit
                }

                if (
                    Array.isArray(data.moderation.automoder.users_slowdown.options) &&
                    JSON.stringify(data.moderation.automoder.users_slowdown.options) !==
                        JSON.stringify(guild.moderation.automoder.users_slowdown.options)
                ) {
                    updateData['moderation.automoder.users_slowdown.options'] = data.moderation.automoder.users_slowdown.options
                }

                if (
                    typeof data.moderation.automoder.users_slowdown.ban_timeout === 'number' &&
                    data.moderation.automoder.users_slowdown.ban_timeout !== guild.moderation.automoder.users_slowdown.ban_timeout
                ) {
                    updateData['moderation.automoder.users_slowdown.ban_timeout'] = data.moderation.automoder.users_slowdown.ban_timeout
                }

                if (
                    typeof data.moderation.automoder.users_slowdown.mute_timeout === 'number' &&
                    data.moderation.automoder.users_slowdown.mute_timeout !== guild.moderation.automoder.users_slowdown.mute_timeout
                ) {
                    updateData['moderation.automoder.users_slowdown.mute_timeout'] = data.moderation.automoder.users_slowdown.mute_timeout
                }

                if (data.moderation.automoder.users_slowdown.modify_roles) {
                    if (
                        Array.isArray(data.moderation.automoder.users_slowdown.modify_roles.add) &&
                        JSON.stringify(data.moderation.automoder.users_slowdown.modify_roles.add) !==
                            JSON.stringify(guild.moderation.automoder.users_slowdown.modify_roles.add)
                    ) {
                        updateData['moderation.automoder.users_slowdown.modify_roles.add'] = data.moderation.automoder.users_slowdown.modify_roles.add
                    }

                    if (
                        Array.isArray(data.moderation.automoder.users_slowdown.modify_roles.remove) &&
                        JSON.stringify(data.moderation.automoder.users_slowdown.modify_roles.remove) !==
                            JSON.stringify(guild.moderation.automoder.users_slowdown.modify_roles.remove)
                    ) {
                        updateData['moderation.automoder.users_slowdown.modify_roles.remove'] =
                            data.moderation.automoder.users_slowdown.modify_roles.remove
                    }
                }

                if (data.moderation.automoder.users_slowdown.send_message) {
                    if (
                        typeof data.moderation.automoder.users_slowdown.send_message.content === 'string' &&
                        data.moderation.automoder.users_slowdown.send_message.content !==
                            guild.moderation.automoder.users_slowdown.send_message.content
                    ) {
                        updateData['moderation.automoder.users_slowdown.send_message.content'] =
                            data.moderation.automoder.users_slowdown.send_message.content
                    }

                    if (data.moderation.automoder.users_slowdown.send_message.embed) {
                        const newEmbed = data.moderation.automoder.users_slowdown.send_message.embed
                        const oldEmbed = guild.moderation.automoder.users_slowdown.send_message.embed

                        if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                            updateData['moderation.automoder.users_slowdown.send_message.embed'] = {
                                active: newEmbed.active ?? oldEmbed.active,
                                title: typeof newEmbed.title == 'undefined' ? oldEmbed.title : newEmbed.title,
                                description: typeof newEmbed.description == 'undefined' ? oldEmbed.description : newEmbed.description,
                                url: typeof newEmbed.url == 'undefined' ? oldEmbed.url : newEmbed.url,
                                timestamp: typeof newEmbed.timestamp == 'undefined' ? oldEmbed.timestamp : newEmbed.timestamp,
                                color: typeof newEmbed.color == 'undefined' ? oldEmbed.color : newEmbed.color,
                                footer: {
                                    text: typeof newEmbed.footer?.text == 'undefined' ? oldEmbed.footer.text : newEmbed.footer.text,
                                    icon_url: typeof newEmbed.footer?.icon_url == 'undefined' ? oldEmbed.footer.icon_url : newEmbed.footer.icon_url
                                },
                                image: {
                                    url: typeof newEmbed.image?.url == 'undefined' ? oldEmbed.image.url : newEmbed.image.url
                                },
                                thumbnail: {
                                    url: typeof newEmbed.thumbnail?.url == 'undefined' ? oldEmbed.thumbnail.url : newEmbed.thumbnail.url
                                },
                                author: {
                                    name: typeof newEmbed.author?.name == 'undefined' ? oldEmbed.author.name : newEmbed.author.name,
                                    url: typeof newEmbed.author?.url == 'undefined' ? oldEmbed.author.url : newEmbed.author.url,
                                    icon_url: typeof newEmbed.author?.icon_url == 'undefined' ? oldEmbed.author.icon_url : newEmbed.author.icon_url
                                },
                                fields: newEmbed.fields ?? oldEmbed.fields
                            }
                        }
                    }
                }

                if (data.moderation.automoder.users_slowdown.ignored) {
                    if (
                        Array.isArray(data.moderation.automoder.users_slowdown.ignored.channels) &&
                        JSON.stringify(data.moderation.automoder.users_slowdown.ignored.channels) !==
                            JSON.stringify(guild.moderation.automoder.users_slowdown.ignored.channels)
                    ) {
                        updateData['moderation.automoder.users_slowdown.ignored.channels'] = data.moderation.automoder.users_slowdown.ignored.channels
                    }

                    if (
                        Array.isArray(data.moderation.automoder.users_slowdown.ignored.roles) &&
                        JSON.stringify(data.moderation.automoder.users_slowdown.ignored.roles) !==
                            JSON.stringify(guild.moderation.automoder.users_slowdown.ignored.roles)
                    ) {
                        updateData['moderation.automoder.users_slowdown.ignored.roles'] = data.moderation.automoder.users_slowdown.ignored.roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.users_slowdown.ignored.permissions) &&
                        JSON.stringify(data.moderation.automoder.users_slowdown.ignored.permissions) !==
                            JSON.stringify(guild.moderation.automoder.users_slowdown.ignored.permissions)
                    ) {
                        updateData['moderation.automoder.users_slowdown.ignored.permissions'] =
                            data.moderation.automoder.users_slowdown.ignored.permissions
                    }
                }
            }
        }

        if (data.moderation.mutes) {
            if (typeof data.moderation.mutes.rar === 'boolean' && data.moderation.mutes.rar !== guild.moderation.mutes.rar) {
                updateData['moderation.mutes.rar'] = data.moderation.mutes.rar
            }

            if (
                Array.isArray(data.moderation.mutes.rar_strict) &&
                JSON.stringify(data.moderation.mutes.rar_strict) !== JSON.stringify(guild.moderation.mutes.rar_strict)
            ) {
                updateData['moderation.mutes.rar_strict'] = data.moderation.mutes.rar_strict
            }
        }
    }

    if (data.modules) {
        if (data.modules.welcome) {
            if (typeof data.modules.welcome.active === 'boolean' && data.modules.welcome.active !== guild.modules.welcome.active) {
                updateData['modules.welcome.active'] = data.modules.welcome.active
            }

            if (
                typeof data.modules.welcome.format === 'string' &&
                data.modules.welcome.format !== guild.modules.welcome.format &&
                ['DM', 'CHANNEL'].includes(data.modules.welcome.format)
            ) {
                updateData['modules.welcome.format'] = data.modules.welcome.format
            }

            if (typeof data.modules.welcome.channel_id === 'string' && data.modules.welcome.channel_id !== guild.modules.welcome.channel_id) {
                updateData['modules.welcome.channel_id'] = data.modules.welcome.channel_id
            }

            if (data.modules.welcome.message) {
                if (
                    typeof data.modules.welcome.message.content === 'string' &&
                    data.modules.welcome.message.content !== guild.modules.welcome.message.content
                ) {
                    updateData['modules.welcome.message.content'] = data.modules.welcome.message.content
                }

                if (data.modules.welcome.message.embed) {
                    const newEmbed = data.modules.welcome.message.embed
                    const oldEmbed = guild.modules.welcome.message.embed

                    if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                        updateData['modules.welcome.message.embed'] = {
                            active: newEmbed.active ?? oldEmbed.active,
                            title: typeof newEmbed.title == 'undefined' ? oldEmbed.title : newEmbed.title,
                            description: typeof newEmbed.description == 'undefined' ? oldEmbed.description : newEmbed.description,
                            url: typeof newEmbed.url == 'undefined' ? oldEmbed.url : newEmbed.url,
                            timestamp: typeof newEmbed.timestamp == 'undefined' ? oldEmbed.timestamp : newEmbed.timestamp,
                            color: typeof newEmbed.color == 'undefined' ? oldEmbed.color : newEmbed.color,
                            footer: {
                                text: typeof newEmbed.footer?.text == 'undefined' ? oldEmbed.footer.text : newEmbed.footer.text,
                                icon_url: typeof newEmbed.footer?.icon_url == 'undefined' ? oldEmbed.footer.icon_url : newEmbed.footer.icon_url
                            },
                            image: {
                                url: typeof newEmbed.image?.url == 'undefined' ? oldEmbed.image.url : newEmbed.image.url
                            },
                            thumbnail: {
                                url: typeof newEmbed.thumbnail?.url == 'undefined' ? oldEmbed.thumbnail.url : newEmbed.thumbnail.url
                            },
                            author: {
                                name: typeof newEmbed.author?.name == 'undefined' ? oldEmbed.author.name : newEmbed.author.name,
                                url: typeof newEmbed.author?.url == 'undefined' ? oldEmbed.author.url : newEmbed.author.url,
                                icon_url: typeof newEmbed.author?.icon_url == 'undefined' ? oldEmbed.author.icon_url : newEmbed.author.icon_url
                            },
                            fields: newEmbed.fields ?? oldEmbed.fields
                        }
                    }
                }

                if (data.modules.welcome.message.image) {
                    const newImage = data.modules.welcome.message.image,
                        oldImage = guild.modules.welcome.message.image

                    if (JSON.stringify(newImage) !== JSON.stringify(oldImage)) {
                        const height = newImage.height ?? oldImage.height,
                            width = newImage.width ?? oldImage.width,
                            elements = newImage.elements ?? oldImage.elements

                        updateData['modules.welcome.message.image'] = {
                            active: newImage.active ?? oldImage.active,
                            height: typeof height === 'number' && height <= 1920 && height >= 256 ? height : 256,
                            width: typeof width === 'number' && width <= 1920 && width >= 256 ? width : 256,
                            background: {
                                color: typeof newImage.background?.color === 'undefined' ? oldImage.background?.color : newImage.background?.color,
                                url: typeof newImage.background?.url === 'undefined' ? oldImage.background?.url : newImage.background?.url
                            },
                            elements: elements.slice(0, guild.premium.available ? 50 : 5).map(v => {
                                const element = {
                                    type: v.type,
                                    posX: typeof v.posX === 'number' && v.posX <= 9999 && v.posX >= -9999 ? v.posX : 0,
                                    posY: typeof v.posY === 'number' && v.posY <= 9999 && v.posY >= -9999 ? v.posY : 0,
                                    height: typeof v.height === 'number' && v.height <= 9999 && v.height >= -9999 ? v.height : 50,
                                    width: typeof v.width === 'number' && v.width <= 9999 && v.width >= -9999 ? v.width : 50
                                }

                                if (v.type === 'IMAGE') {
                                    element['url'] = v.url ? v.url : null
                                    element['border_radius'] = Object.keys(borderRadiuses).includes(v.border_radius) ? v.border_radius : 'none'
                                } else if (v.type === 'TEXT') {
                                    element['value'] = typeof v.value === 'string' ? v.value : 'Text'
                                    element['color'] = v.color ?? 'rgba(255,255,255,1)'
                                    element['size'] = Object.keys(textSizes).includes(v.size) ? v.size : 'body2'
                                    element['style'] = textStyles.includes(v.style) ? v.style : 'normal'
                                    element['transform'] = textTransforms.includes(v.transform) ? v.transform : 'none'
                                    element['decoration'] = textDecorations.includes(v.decoration) ? v.decoration : 'none'
                                    element['align'] = textAligns.includes(v.align) ? v.align : 'center'
                                }

                                return element
                            })
                        }
                    }
                }
            }

            if (data.modules.welcome.initial_roles) {
                if (
                    typeof data.modules.welcome.initial_roles.active === 'boolean' &&
                    data.modules.welcome.initial_roles.active !== guild.modules.welcome.initial_roles.active
                ) {
                    updateData['modules.welcome.initial_roles.active'] = data.modules.welcome.initial_roles.active
                }

                if (
                    Array.isArray(data.modules.welcome.initial_roles.roles) &&
                    JSON.stringify(data.modules.welcome.initial_roles.roles) !== JSON.stringify(guild.modules.welcome.initial_roles.roles)
                ) {
                    updateData['modules.welcome.initial_roles.roles'] = data.modules.welcome.initial_roles.roles
                }
            }
        }

        if (data.modules.farewell) {
            if (typeof data.modules.farewell.active === 'boolean' && data.modules.farewell.active !== guild.modules.farewell.active) {
                updateData['modules.farewell.active'] = data.modules.farewell.active
            }

            if (
                typeof data.modules.farewell.format === 'string' &&
                data.modules.farewell.format !== guild.modules.farewell.format &&
                ['DM', 'CHANNEL'].includes(data.modules.farewell.format)
            ) {
                updateData['modules.farewell.format'] = data.modules.farewell.format
            }

            if (typeof data.modules.farewell.channel_id === 'string' && data.modules.farewell.channel_id !== guild.modules.farewell.channel_id) {
                updateData['modules.farewell.channel_id'] = data.modules.farewell.channel_id
            }

            if (data.modules.farewell.message) {
                if (
                    typeof data.modules.farewell.message.content === 'string' &&
                    data.modules.farewell.message.content !== guild.modules.farewell.message.content
                ) {
                    updateData['modules.farewell.message.content'] = data.modules.farewell.message.content
                }

                if (data.modules.farewell.message.embed) {
                    const newEmbed = data.modules.farewell.message.embed
                    const oldEmbed = guild.modules.farewell.message.embed

                    if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                        updateData['modules.farewell.message.embed'] = {
                            active: newEmbed.active ?? oldEmbed.active,
                            title: typeof newEmbed.title == 'undefined' ? oldEmbed.title : newEmbed.title,
                            description: typeof newEmbed.description == 'undefined' ? oldEmbed.description : newEmbed.description,
                            url: typeof newEmbed.url == 'undefined' ? oldEmbed.url : newEmbed.url,
                            timestamp: typeof newEmbed.timestamp == 'undefined' ? oldEmbed.timestamp : newEmbed.timestamp,
                            color: typeof newEmbed.color == 'undefined' ? oldEmbed.color : newEmbed.color,
                            footer: {
                                text: typeof newEmbed.footer?.text == 'undefined' ? oldEmbed.footer.text : newEmbed.footer.text,
                                icon_url: typeof newEmbed.footer?.icon_url == 'undefined' ? oldEmbed.footer.icon_url : newEmbed.footer.icon_url
                            },
                            image: {
                                url: typeof newEmbed.image?.url == 'undefined' ? oldEmbed.image.url : newEmbed.image.url
                            },
                            thumbnail: {
                                url: typeof newEmbed.thumbnail?.url == 'undefined' ? oldEmbed.thumbnail.url : newEmbed.thumbnail.url
                            },
                            author: {
                                name: typeof newEmbed.author?.name == 'undefined' ? oldEmbed.author.name : newEmbed.author.name,
                                url: typeof newEmbed.author?.url == 'undefined' ? oldEmbed.author.url : newEmbed.author.url,
                                icon_url: typeof newEmbed.author?.icon_url == 'undefined' ? oldEmbed.author.icon_url : newEmbed.author.icon_url
                            },
                            fields: newEmbed.fields ?? oldEmbed.fields
                        }
                    }
                }

                if (data.modules.farewell.message.image) {
                    const newImage = data.modules.farewell.message.image,
                        oldImage = guild.modules.farewell.message.image

                    if (JSON.stringify(newImage) !== JSON.stringify(oldImage)) {
                        const height = newImage.height ?? oldImage.height,
                            width = newImage.width ?? oldImage.width,
                            elements = newImage.elements ?? oldImage.elements

                        updateData['modules.farewell.message.image'] = {
                            active: newImage.active ?? oldImage.active,
                            height: typeof height === 'number' && height <= 1920 && height >= 256 ? height : 256,
                            width: typeof width === 'number' && width <= 1920 && width >= 256 ? width : 256,
                            background: {
                                color: typeof newImage.background?.color === 'undefined' ? oldImage.background?.color : newImage.background?.color,
                                url: typeof newImage.background?.url === 'undefined' ? oldImage.background?.url : newImage.background?.url
                            },
                            elements: elements.slice(0, guild.premium.available ? 50 : 5).map(v => {
                                const element = {
                                    type: v.type,
                                    posX: typeof v.posX === 'number' && v.posX <= 9999 && v.posX >= -9999 ? v.posX : 0,
                                    posY: typeof v.posY === 'number' && v.posY <= 9999 && v.posY >= -9999 ? v.posY : 0,
                                    height: typeof v.height === 'number' && v.height <= 9999 && v.height >= -9999 ? v.height : 50,
                                    width: typeof v.width === 'number' && v.width <= 9999 && v.width >= -9999 ? v.width : 50
                                }

                                if (v.type === 'IMAGE') {
                                    element['url'] = v.url ? v.url : null
                                    element['border_radius'] = Object.keys(borderRadiuses).includes(v.border_radius) ? v.border_radius : 'none'
                                } else if (v.type === 'TEXT') {
                                    element['value'] = typeof v.value === 'string' ? v.value : 'Text'
                                    element['color'] = v.color ?? 'rgba(255,255,255,1)'
                                    element['size'] = Object.keys(textSizes).includes(v.size) ? v.size : 'body2'
                                    element['style'] = textStyles.includes(v.style) ? v.style : 'normal'
                                    element['transform'] = textTransforms.includes(v.transform) ? v.transform : 'none'
                                    element['decoration'] = textDecorations.includes(v.decoration) ? v.decoration : 'none'
                                    element['align'] = textAligns.includes(v.align) ? v.align : 'center'
                                }

                                return element
                            })
                        }
                    }
                }
            }
        }

        if (data.modules.levels) {
            if (typeof data.modules.levels.active === 'boolean' && data.modules.levels.active !== guild.modules.levels.active) {
                updateData['modules.levels.active'] = data.modules.levels.active
            }

            if (typeof data.modules.levels.voice === 'boolean' && data.modules.levels.voice !== guild.modules.levels.voice) {
                updateData['modules.levels.voice'] = data.modules.levels.voice
            }

            if (
                typeof data.modules.levels.reset_on_leave === 'boolean' &&
                data.modules.levels.reset_on_leave !== guild.modules.levels.reset_on_leave
            ) {
                updateData['modules.levels.reset_on_leave'] = data.modules.levels.reset_on_leave
            }

            if (data.modules.levels.allowed) {
                if (
                    Array.isArray(data.modules.levels.allowed.channels) &&
                    JSON.stringify(data.modules.levels.allowed.channels) !== JSON.stringify(guild.modules.levels.allowed.channels)
                ) {
                    updateData['modules.levels.allowed.channels'] = data.modules.levels.allowed.channels
                }

                if (
                    Array.isArray(data.modules.levels.allowed.roles) &&
                    JSON.stringify(data.modules.levels.allowed.roles) !== JSON.stringify(guild.modules.levels.allowed.roles)
                ) {
                    updateData['modules.levels.allowed.roles'] = data.modules.levels.allowed.roles
                }
            }

            if (data.modules.levels.blocked) {
                if (
                    Array.isArray(data.modules.levels.blocked.channels) &&
                    JSON.stringify(data.modules.levels.blocked.channels) !== JSON.stringify(guild.modules.levels.blocked.channels)
                ) {
                    updateData['modules.levels.blocked.channels'] = data.modules.levels.blocked.channels
                }

                if (
                    Array.isArray(data.modules.levels.blocked.roles) &&
                    JSON.stringify(data.modules.levels.blocked.roles) !== JSON.stringify(guild.modules.levels.blocked.roles)
                ) {
                    updateData['modules.levels.blocked.roles'] = data.modules.levels.blocked.roles
                }
            }

            if (data.modules.levels.level_up_alerts) {
                if (
                    typeof data.modules.levels.level_up_alerts.active === 'boolean' &&
                    data.modules.levels.level_up_alerts.active !== guild.modules.levels.level_up_alerts.active
                ) {
                    updateData['modules.levels.level_up_alerts.active'] = data.modules.levels.level_up_alerts.active
                }

                if (
                    typeof data.modules.levels.level_up_alerts.format === 'string' &&
                    data.modules.levels.level_up_alerts.format !== guild.modules.levels.level_up_alerts.format
                ) {
                    updateData['modules.levels.level_up_alerts.format'] = data.modules.levels.level_up_alerts.format
                }

                if (
                    typeof data.modules.levels.level_up_alerts.channel_id === 'string' &&
                    data.modules.levels.level_up_alerts.channel_id !== guild.modules.levels.level_up_alerts.channel_id
                ) {
                    updateData['modules.levels.level_up_alerts.channel_id'] = data.modules.levels.level_up_alerts.channel_id
                }

                if (data.modules.levels.level_up_alerts.message) {
                    if (
                        typeof data.modules.levels.level_up_alerts.message.content === 'string' &&
                        data.modules.levels.level_up_alerts.message.content !== guild.modules.levels.level_up_alerts.message.content
                    ) {
                        updateData['modules.levels.level_up_alerts.message.content'] = data.modules.levels.level_up_alerts.message.content
                    }

                    if (data.modules.levels.level_up_alerts.message.embed) {
                        const newEmbed = data.modules.levels.level_up_alerts.message.embed
                        const oldEmbed = guild.modules.levels.level_up_alerts.message.embed

                        if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                            updateData['modules.levels.level_up_alerts.message.embed'] = {
                                active: newEmbed.active ?? oldEmbed.active,
                                title: typeof newEmbed.title == 'undefined' ? oldEmbed.title : newEmbed.title,
                                description: typeof newEmbed.description == 'undefined' ? oldEmbed.description : newEmbed.description,
                                url: typeof newEmbed.url == 'undefined' ? oldEmbed.url : newEmbed.url,
                                timestamp: typeof newEmbed.timestamp == 'undefined' ? oldEmbed.timestamp : newEmbed.timestamp,
                                color: typeof newEmbed.color == 'undefined' ? oldEmbed.color : newEmbed.color,
                                footer: {
                                    text: typeof newEmbed.footer?.text == 'undefined' ? oldEmbed.footer.text : newEmbed.footer.text,
                                    icon_url: typeof newEmbed.footer?.icon_url == 'undefined' ? oldEmbed.footer.icon_url : newEmbed.footer.icon_url
                                },
                                image: {
                                    url: typeof newEmbed.image?.url == 'undefined' ? oldEmbed.image.url : newEmbed.image.url
                                },
                                thumbnail: {
                                    url: typeof newEmbed.thumbnail?.url == 'undefined' ? oldEmbed.thumbnail.url : newEmbed.thumbnail.url
                                },
                                author: {
                                    name: typeof newEmbed.author?.name == 'undefined' ? oldEmbed.author.name : newEmbed.author.name,
                                    url: typeof newEmbed.author?.url == 'undefined' ? oldEmbed.author.url : newEmbed.author.url,
                                    icon_url: typeof newEmbed.author?.icon_url == 'undefined' ? oldEmbed.author.icon_url : newEmbed.author.icon_url
                                },
                                fields: newEmbed.fields ?? oldEmbed.fields
                            }
                        }
                    }

                    if (data.modules.levels.level_up_alerts.message.image) {
                        const newImage = data.modules.levels.level_up_alerts.message.image,
                            oldImage = guild.modules.levels.level_up_alerts.message.image

                        if (JSON.stringify(newImage) !== JSON.stringify(oldImage)) {
                            const height = newImage.height ?? oldImage.height,
                                width = newImage.width ?? oldImage.width,
                                elements = newImage.elements ?? oldImage.elements

                            updateData['modules.levels.level_up_alerts.message.image'] = {
                                active: newImage.active ?? oldImage.active,
                                height: typeof height === 'number' && height <= 1920 && height >= 256 ? height : 256,
                                width: typeof width === 'number' && width <= 1920 && width >= 256 ? width : 256,
                                background: {
                                    color:
                                        typeof newImage.background?.color === 'undefined' ? oldImage.background?.color : newImage.background?.color,
                                    url: typeof newImage.background?.url === 'undefined' ? oldImage.background?.url : newImage.background?.url
                                },
                                elements: elements.slice(0, guild.premium.available ? 50 : 5).map(v => {
                                    const element = {
                                        type: v.type,
                                        posX: typeof v.posX === 'number' && v.posX <= 9999 && v.posX >= -9999 ? v.posX : 0,
                                        posY: typeof v.posY === 'number' && v.posY <= 9999 && v.posY >= -9999 ? v.posY : 0,
                                        height: typeof v.height === 'number' && v.height <= 9999 && v.height >= -9999 ? v.height : 50,
                                        width: typeof v.width === 'number' && v.width <= 9999 && v.width >= -9999 ? v.width : 50
                                    }

                                    if (v.type === 'IMAGE') {
                                        element['url'] = v.url ? v.url : null
                                        element['border_radius'] = Object.keys(borderRadiuses).includes(v.border_radius) ? v.border_radius : 'none'
                                    } else if (v.type === 'TEXT') {
                                        element['value'] = typeof v.value === 'string' ? v.value : 'Text'
                                        element['color'] = v.color ?? 'rgba(255,255,255,1)'
                                        element['size'] = Object.keys(textSizes).includes(v.size) ? v.size : 'body2'
                                        element['style'] = textStyles.includes(v.style) ? v.style : 'normal'
                                        element['transform'] = textTransforms.includes(v.transform) ? v.transform : 'none'
                                        element['decoration'] = textDecorations.includes(v.decoration) ? v.decoration : 'none'
                                        element['align'] = textAligns.includes(v.align) ? v.align : 'center'
                                    }

                                    return element
                                })
                            }
                        }
                    }
                }
            }

            if (
                Array.isArray(data.modules.levels.awards) &&
                JSON.stringify(data.modules.levels.awards) !== JSON.stringify(guild.modules.levels.awards)
            ) {
                updateData['modules.levels.awards'] = data.modules.levels.awards
            }
        }

        if (data.modules.restoring) {
            if (
                typeof data.modules.restoring.restore_nicknames === 'boolean' &&
                data.modules.restoring.restore_nicknames !== guild.modules.restoring.restore_nicknames
            ) {
                updateData['modules.restoring.restore_nicknames'] = data.modules.restoring.restore_nicknames
            }

            if (
                typeof data.modules.restoring.restore_roles === 'boolean' &&
                data.modules.restoring.restore_roles !== guild.modules.restoring.restore_roles
            ) {
                updateData['modules.restoring.restore_roles'] = data.modules.restoring.restore_roles
            }

            if (
                Array.isArray(data.modules.restoring.strict_roles) &&
                JSON.stringify(data.modules.restoring.strict_roles) !== JSON.stringify(guild.modules.restoring.strict_roles)
            ) {
                updateData['modules.restoring.strict_roles'] = data.modules.restoring.strict_roles
            }
        }

        if (data.modules.music) {
            if (
                Array.isArray(data.modules.music.allowed?.channels) &&
                JSON.stringify(data.modules.music.allowed?.channels) !== JSON.stringify(guild.modules.music.allowed?.channels)
            ) {
                updateData['modules.music.allowed.channels'] = data.modules.music.allowed.channels
            }

            if (
                Array.isArray(data.modules.music.blocked?.channels) &&
                JSON.stringify(data.modules.music.blocked?.channels) !== JSON.stringify(guild.modules.music.blocked?.channels)
            ) {
                updateData['modules.music.blocked.channels'] = data.modules.music.blocked.channels
            }

            if (
                typeof data.modules.music.allow_radio_playback === 'boolean' &&
                data.modules.music.allow_radio_playback !== guild.modules.music.allow_radio_playback &&
                guild.premium.available
            ) {
                updateData['modules.music.allow_radio_playback'] = data.modules.music.allow_radio_playback
            }

            if (
                typeof data.modules.music.queue_max_length === 'number' &&
                data.modules.music.queue_max_length !== guild.modules.music.queue_max_length &&
                guild.premium.available
            ) {
                updateData['modules.music.queue_max_length'] = data.modules.music.queue_max_length
            }

            if (
                typeof data.modules.music.default_volume === 'number' &&
                data.modules.music.default_volume !== guild.modules.music.default_volume &&
                guild.premium.available
            ) {
                updateData['modules.music.default_volume'] = data.modules.music.default_volume
            }

            if (
                typeof data.modules.music.default_source === 'string' &&
                Object.keys(lavalinkSources).includes(data.modules.music.default_source) &&
                data.modules.music.default_source !== guild.modules.music.default_source
            ) {
                updateData['modules.music.default_source'] = data.modules.music.default_source
            }
        }

        if (data.modules.voice_manager) {
            if (
                Array.isArray(data.modules.voice_manager.voice_roles) &&
                JSON.stringify(data.modules.voice_manager.voice_roles) !== JSON.stringify(guild.modules.voice_manager.voice_roles)
            ) {
                updateData['modules.voice_manager.voice_roles'] = data.modules.voice_manager.voice_roles
            }
        }

        if (data.modules.reports) {
            if (typeof data.modules.reports.active === 'boolean' && data.modules.reports.active !== guild.modules.reports.active) {
                updateData['modules.reports.active'] = data.modules.reports.active
            }

            if (typeof data.modules.reports.channel_id === 'string' && data.modules.reports.channel_id !== guild.modules.reports.channel_id) {
                updateData['modules.reports.channel_id'] = data.modules.reports.channel_id
            }

            if (
                typeof data.modules.reports.notify_about_unwanted_users === 'boolean' &&
                data.modules.reports.notify_about_unwanted_users !== guild.modules.reports.notify_about_unwanted_users
            ) {
                updateData['modules.reports.notify_about_unwanted_users'] = data.modules.reports.notify_about_unwanted_users
            }
        }

        if (Array.isArray(data.modules.autothreads) && JSON.stringify(data.modules.autothreads) !== JSON.stringify(guild.modules.autothreads)) {
            updateData['modules.autothreads'] = data.modules.autothreads
        }

        if (Array.isArray(data.modules.autoreactions) && JSON.stringify(data.modules.autoreactions) !== JSON.stringify(guild.modules.autoreactions)) {
            for (const reaction of data.modules.autoreactions.slice(0, guild.premium.available ? 20 : 2)) {
                reaction.reactions
                    .filter(emoji => !emoji.name)
                    .forEach(emoji => {
                        const index = reaction.reactions.indexOf(emoji)
                        reaction.reactions[index] = parseEmoji(emoji as any)
                    })
            }

            updateData['modules.autoreactions'] = data.modules.autoreactions
        }

        if (data.modules.economy) {
            if (typeof data.modules.economy.active == 'boolean' && data.modules.economy.active !== guild.modules.economy.active) {
                updateData['modules.economy.active'] = data.modules.economy.active
            }

            if (
                typeof data.modules.economy.reset_wallet_on_leave == 'boolean' &&
                data.modules.economy.reset_wallet_on_leave !== guild.modules.economy.reset_wallet_on_leave
            ) {
                updateData['modules.economy.reset_wallet_on_leave'] = data.modules.economy.reset_wallet_on_leave
            }

            if (
                Array.isArray(data.modules.economy.currencies) &&
                data.modules.economy.currencies.some(i => i.id == 'DEFAULT') &&
                JSON.stringify(data.modules.economy.currencies) !== JSON.stringify(guild.modules.economy.currencies)
            ) {
                updateData['modules.economy.currencies'] = data.modules.economy.currencies.slice(0, 2)
            }

            if (
                Array.isArray(data.modules.economy.store?.items) &&
                JSON.stringify(data.modules.economy.store.items) !== JSON.stringify(guild.modules.economy.store.items)
            ) {
                updateData['modules.economy.store.items'] = data.modules.economy.store.items
            }

            if (data.modules.economy.transfer) {
                if (
                    Array.isArray(data.modules.economy.transfer.allowed_roles) &&
                    JSON.stringify(data.modules.economy.transfer.allowed_roles) !== JSON.stringify(guild.modules.economy.transfer.allowed_roles)
                ) {
                    updateData['modules.economy.transfer.allowed_roles'] = data.modules.economy.transfer.allowed_roles
                }

                if (
                    Array.isArray(data.modules.economy.transfer.blocked_roles) &&
                    JSON.stringify(data.modules.economy.transfer.blocked_roles) !== JSON.stringify(guild.modules.economy.transfer.blocked_roles)
                ) {
                    updateData['modules.economy.transfer.blocked_roles'] = data.modules.economy.transfer.blocked_roles
                }
            }
        }

        if (data.modules.activities) {
            if (
                Array.isArray(data.modules.activities.multipliers) &&
                JSON.stringify(data.modules.activities.multipliers) !== JSON.stringify(guild.modules.activities.multipliers)
            ) {
                updateData['modules.activities.multipliers'] = data.modules.activities.multipliers
            }
        }

        if (
            data.modules.automation &&
            Array.isArray(data.modules.automation) &&
            JSON.stringify(data.modules.automation) !== JSON.stringify(guild.modules.automation)
        ) {
            updateData['modules.automation'] = data.modules.automation
        }

        if (data.modules.guild_image_rotation) {
            if (data.modules.guild_image_rotation.banner) {
                if (
                    typeof data.modules.guild_image_rotation.banner.active === 'boolean' &&
                    data.modules.guild_image_rotation.banner.active !== guild.modules.guild_image_rotation.banner.active
                ) {
                    updateData['modules.guild_image_rotation.banner.active'] = data.modules.guild_image_rotation.banner.active
                }

                if (data.modules.guild_image_rotation.banner.image) {
                    const newImage = data.modules.guild_image_rotation.banner.image,
                        oldImage = guild.modules.guild_image_rotation.banner.image

                    if (JSON.stringify(newImage) !== JSON.stringify(oldImage)) {
                        const elements = newImage.elements ?? oldImage.elements

                        updateData['modules.guild_image_rotation.banner.image'] = {
                            active: true,
                            height: 540,
                            width: 960,
                            background: {
                                color: typeof newImage.background?.color === 'undefined' ? oldImage.background?.color : newImage.background?.color,
                                url: typeof newImage.background?.url === 'undefined' ? oldImage.background?.url : newImage.background?.url
                            },
                            elements: elements.slice(0, guild.premium.available ? 50 : 5).map(v => {
                                const element = {
                                    type: v.type,
                                    posX: typeof v.posX === 'number' && v.posX <= 9999 && v.posX >= -9999 ? v.posX : 0,
                                    posY: typeof v.posY === 'number' && v.posY <= 9999 && v.posY >= -9999 ? v.posY : 0,
                                    height: typeof v.height === 'number' && v.height <= 9999 && v.height >= -9999 ? v.height : 50,
                                    width: typeof v.width === 'number' && v.width <= 9999 && v.width >= -9999 ? v.width : 50
                                }

                                if (v.type === 'IMAGE') {
                                    element['url'] = v.url ? v.url : null
                                    element['border_radius'] = Object.keys(borderRadiuses).includes(v.border_radius) ? v.border_radius : 'none'
                                } else if (v.type === 'TEXT') {
                                    element['value'] = typeof v.value === 'string' ? v.value : 'Text'
                                    element['color'] = v.color ?? 'rgba(255,255,255,1)'
                                    element['size'] = Object.keys(textSizes).includes(v.size) ? v.size : 'body2'
                                    element['style'] = textStyles.includes(v.style) ? v.style : 'normal'
                                    element['transform'] = textTransforms.includes(v.transform) ? v.transform : 'none'
                                    element['decoration'] = textDecorations.includes(v.decoration) ? v.decoration : 'none'
                                    element['align'] = textAligns.includes(v.align) ? v.align : 'center'
                                }

                                return element
                            })
                        }
                    }
                }
            }
        }
    }

    if (data.web_page) {
        if (typeof data.web_page.public_leaderboard === 'boolean' && data.web_page.public_leaderboard !== guild.web_page.public_leaderboard) {
            updateData['web_page.public_leaderboard'] = data.web_page.public_leaderboard
        }
    }

    if (Object.keys(updateData).length) {
        const changes = [...new Set(Object.keys(dotNotateObject(data)).map(k => k.split('.').slice(0, 3).join('.')))]

        await database.servers.updateOne(
            { _id: guild._id },
            {
                $set: updateData,
                $push: {
                    change_log: {
                        $each: [{ user_id, changes, timestamp: Date.now() }],
                        $sort: { timestamp: 1 },
                        $slice: -50
                    } as never
                }
            }
        )
    }

    return await database.servers.findOne({ _id: guild._id })
}
