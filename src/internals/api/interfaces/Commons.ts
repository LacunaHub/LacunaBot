import { Util } from 'discord.js'
import qdb from 'quick.db'
import database from '../../../database'
import { ServerDocument } from '../../../database/schemas/Servers'
import translator from '../../locale'
import { commandOptionTypes } from '../../utility/Constants'
import DiscordUtils from '../../utility/DiscordUtils'
import { dotNotateObject, resolveObjectPath } from '../../utility/Utils'

export async function updateSettings(guild: ServerDocument, data: Partial<ServerDocument>, user_id: string): Promise<ServerDocument> {
    const updateData = {}

    if (typeof data.prefix === 'string' && data.prefix !== guild.prefix) {
        if (data.prefix.length && data.prefix !== '/') {
            updateData['prefix'] = data.prefix.slice(0, 3)
        }
    }

    if (typeof data.locale === 'string' && data.locale !== guild.locale) {
        if (['ru', 'en'].includes(data.locale)) {
            updateData['locale'] = data.locale
        }
    }

    if (Array.isArray(data.server?.bot_expert_roles) && JSON.stringify(data.server.bot_expert_roles) !== JSON.stringify(guild.server.bot_expert_roles)) {
        updateData['server.bot_expert_roles'] = data.server.bot_expert_roles
    }

    if (data.commands) {
        if (Array.isArray(data.commands.configuration) && JSON.stringify(data.commands.configuration) !== JSON.stringify(guild.commands.configuration)) {
            updateData['commands.configuration'] = data.commands.configuration
        }

        if (Array.isArray(data.commands.system) && JSON.stringify(data.commands.system) !== JSON.stringify(guild.commands.system)) {
            updateData['commands.system'] = data.commands.system
        }

        if (Array.isArray(data.commands.custom) && JSON.stringify(data.commands.custom) !== JSON.stringify(guild.commands.custom)) {
            data.commands.custom = data.commands.custom.slice(0, 100)
            data.commands.custom = [...new Map(data.commands.custom.map(c => [c.name.toLowerCase(), c])).values()]

            updateData['commands.custom'] = data.commands.custom
        }

        if (
            (typeof data.commands.slash_commands === 'boolean' && data.commands.slash_commands) ||
            (guild.commands.slash_commands && Array.isArray(data.commands.system))
        ) {
            const dataCommands = data.commands.system?.length ? data.commands.system : guild.commands.system
            const locale = translator.locale(data.locale ?? guild.locale)

            let commands = qdb.get('commands')

            const slash = commands
                .filter(c => c.is_slash_command && !dataCommands.find(sc => sc.name == c.name)?.inactive)
                .map(c => {
                    return {
                        name: c.name,
                        description: resolveObjectPath(c.description, locale),
                        type: 1,
                        options:
                            c?.options?.map(option => {
                                if (option.type == 'SUB_COMMAND')
                                    return {
                                        ...option,
                                        type: commandOptionTypes[option.type],
                                        description: resolveObjectPath(option.description, locale),
                                        options:
                                            option.options?.map(o => {
                                                return {
                                                    ...o,
                                                    type: commandOptionTypes[o.type],
                                                    name: resolveObjectPath(o.name, locale),
                                                    description: resolveObjectPath(o.description, locale),
                                                    choices: option.choices?.length
                                                        ? option.choices.map(oc => {
                                                              return { ...oc, name: resolveObjectPath(oc.name, locale) }
                                                          })
                                                        : null
                                                }
                                            }) ?? []
                                    }

                                return {
                                    ...option,
                                    type: commandOptionTypes[option.type],
                                    name: resolveObjectPath(option.name, locale),
                                    description: resolveObjectPath(option.description, locale),
                                    choices: option.choices?.length
                                        ? option.choices.map(oc => {
                                              return { ...oc, name: resolveObjectPath(oc.name, locale) }
                                          })
                                        : null
                                }
                            }) ?? []
                    }
                })

            const message = commands
                .filter(c => c.is_message_command && !dataCommands.find(sc => sc.name == c.name)?.inactive)
                .map(c => {
                    return {
                        name: resolveObjectPath(c.pretty_name, locale),
                        type: 3
                    }
                })

            const user = commands
                .filter(c => c.is_user_command && !dataCommands.find(sc => sc.name == c.name)?.inactive)
                .map(c => {
                    return {
                        name: resolveObjectPath(c.pretty_name, locale),
                        type: 2
                    }
                })

            commands = [...slash, ...message, ...user]

            const res = await DiscordUtils.restApi
                .put(DiscordUtils.apiRoutes.applicationGuildCommands(process.env.CLIENT_ID, guild._id), {
                    body: commands
                })
                .catch(() => {})

            if (typeof res !== 'undefined' && typeof data.commands.slash_commands === 'boolean') {
                updateData['commands.slash_commands'] = data.commands.slash_commands
            }
        }

        if (typeof data.commands.slash_commands === 'boolean' && !data.commands.slash_commands) {
            const res = await DiscordUtils.restApi.put(DiscordUtils.apiRoutes.applicationGuildCommands(process.env.CLIENT_ID, guild._id), { body: [] }).catch(() => {})

            if (typeof res !== 'undefined') {
                updateData['commands.slash_commands'] = data.commands.slash_commands
            }
        }

        if (typeof data.commands.prefix_commands === 'boolean' && data.commands.prefix_commands !== guild.commands.prefix_commands) {
            updateData['commands.prefix_commands'] = data.commands.prefix_commands
        }
    }

    if (data.moderation) {
        if (data.moderation.case_log) {
            if (
                (typeof data.moderation.case_log.channel_id === 'string' || data.moderation.case_log.channel_id === null) &&
                data.moderation.case_log.channel_id !== guild.moderation.case_log.channel_id
            ) {
                updateData['moderation.case_log.channel_id'] = data.moderation.case_log.channel_id
            }

            if (typeof data.moderation.case_log.case_types === 'object' && data.moderation.case_log.case_types !== null) {
                updateData['moderation.case_log.case_types'] = {
                    BAN_ADD: Boolean(data.moderation.case_log.case_types.BAN_ADD ?? guild.moderation.case_log.case_types.BAN_ADD),
                    BAN_REMOVE: Boolean(data.moderation.case_log.case_types.BAN_REMOVE ?? guild.moderation.case_log.case_types.BAN_REMOVE),
                    KICK: Boolean(data.moderation.case_log.case_types.KICK ?? guild.moderation.case_log.case_types.KICK),
                    MUTE_ADD: Boolean(data.moderation.case_log.case_types.MUTE_ADD ?? guild.moderation.case_log.case_types.MUTE_ADD),
                    MUTE_REMOVE: Boolean(data.moderation.case_log.case_types.MUTE_REMOVE ?? guild.moderation.case_log.case_types.MUTE_REMOVE),
                    PRUNE_MESSAGES: Boolean(data.moderation.case_log.case_types.PRUNE_MESSAGES ?? guild.moderation.case_log.case_types.PRUNE_MESSAGES),
                    WARN_ADD: Boolean(data.moderation.case_log.case_types.WARN_ADD ?? guild.moderation.case_log.case_types.WARN_ADD),
                    WARN_REMOVE: Boolean(data.moderation.case_log.case_types.WARN_REMOVE ?? guild.moderation.case_log.case_types.WARN_REMOVE)
                }
            }

            if (typeof data.moderation.case_log.case_types_messages === 'object' && data.moderation.case_log.case_types_messages !== null) {
                for (const type of Object.keys(data.moderation.case_log.case_types_messages)) {
                    const current = data.moderation.case_log.case_types_messages[type],
                        previous = guild.moderation.case_log.case_types_messages[type]

                    if (JSON.stringify(current) !== JSON.stringify(previous)) {
                        updateData[`moderation.case_log.case_types_messages.${type}`] = {
                            active: current.active ?? previous.active,
                            dm_message: {
                                content: current.dm_message?.content ?? previous.dm_message.content,
                                embed: {
                                    active: current.dm_message?.embed?.active ?? previous.dm_message.embed.active,
                                    title: typeof current.dm_message?.embed?.title === 'undefined' ? previous.dm_message.embed.title : current.dm_message.embed.title,
                                    description:
                                        typeof current.dm_message?.embed?.description === 'undefined'
                                            ? previous.dm_message.embed.description
                                            : current.dm_message.embed.description,
                                    url: typeof current.dm_message?.embed?.url === 'undefined' ? previous.dm_message.embed.url : current.dm_message.embed.url,
                                    timestamp:
                                        typeof current.dm_message?.embed?.timestamp === 'undefined'
                                            ? previous.dm_message.embed.timestamp
                                            : current.dm_message.embed.timestamp,
                                    color: typeof current.dm_message?.embed?.color === 'undefined' ? previous.dm_message.embed.color : current.dm_message.embed.color,
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
                        ((typeof current.channel_id === 'boolean' || typeof current.channel_id === null) && current.channel_id !== previous.channel_id)
                    ) {
                        updateData[`moderation.logs.types.${log}`] = {
                            active: Boolean(current.active ?? previous.active),
                            channel_id: current.channel_id ?? previous.channel_id
                        }
                    }
                }
            }
        }

        if (data.moderation.roles) {
            if ((typeof data.moderation.roles.mute === 'string' || data.moderation.roles.mute === null) && data.moderation.roles.mute !== guild.moderation.roles.mute) {
                updateData['moderation.roles.mute'] = data.moderation.roles.mute
            }

            if (data.moderation.roles.on_mute) {
                if (
                    typeof data.moderation.roles.on_mute.remove_all_roles === 'boolean' &&
                    data.moderation.roles.on_mute.remove_all_roles !== guild.moderation.roles.on_mute.remove_all_roles
                ) {
                    updateData['moderation.roles.on_mute.remove_all_roles'] = data.moderation.roles.on_mute.remove_all_roles
                }

                if (
                    Array.isArray(data.moderation.roles.on_mute.strict_roles) &&
                    JSON.stringify(data.moderation.roles.on_mute.strict_roles) !== JSON.stringify(guild.moderation.roles.on_mute.strict_roles)
                ) {
                    updateData['moderation.roles.on_mute.strict_roles'] = data.moderation.roles.on_mute.strict_roles
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
            if (data.moderation.automoder.links_filter) {
                if (
                    typeof data.moderation.automoder.links_filter.active === 'boolean' &&
                    data.moderation.automoder.links_filter.active !== guild.moderation.automoder.links_filter.active
                ) {
                    updateData['moderation.automoder.links_filter.active'] = data.moderation.automoder.links_filter.active
                }

                if (
                    Array.isArray(data.moderation.automoder.links_filter.registry) &&
                    JSON.stringify(data.moderation.automoder.links_filter.registry) !== JSON.stringify(guild.moderation.automoder.links_filter.registry)
                ) {
                    updateData['moderation.automoder.links_filter.registry'] = data.moderation.automoder.links_filter.registry
                }

                if (
                    Array.isArray(data.moderation.automoder.links_filter.allowed_registry) &&
                    JSON.stringify(data.moderation.automoder.links_filter.allowed_registry) !== JSON.stringify(guild.moderation.automoder.links_filter.allowed_registry)
                ) {
                    updateData['moderation.automoder.links_filter.allowed_registry'] = data.moderation.automoder.links_filter.allowed_registry
                }

                if (
                    typeof data.moderation.automoder.links_filter.delete_all_links === 'boolean' &&
                    data.moderation.automoder.links_filter.delete_all_links !== guild.moderation.automoder.links_filter.delete_all_links
                ) {
                    updateData['moderation.automoder.links_filter.delete_all_links'] = data.moderation.automoder.links_filter.delete_all_links
                }

                if (
                    typeof data.moderation.automoder.links_filter.delete_referral_invites === 'boolean' &&
                    data.moderation.automoder.links_filter.delete_referral_invites !== guild.moderation.automoder.links_filter.delete_referral_invites
                ) {
                    updateData['moderation.automoder.links_filter.delete_referral_invites'] = data.moderation.automoder.links_filter.delete_referral_invites
                }

                if (data.moderation.automoder.links_filter.penalty) {
                    if (
                        typeof data.moderation.automoder.links_filter.penalty.action === 'number' &&
                        data.moderation.automoder.links_filter.penalty.action !== guild.moderation.automoder.links_filter.penalty.action
                    ) {
                        updateData['moderation.automoder.links_filter.penalty.action']
                    }

                    if (
                        typeof data.moderation.automoder.links_filter.penalty.timer === 'number' &&
                        data.moderation.automoder.links_filter.penalty.timer !== guild.moderation.automoder.links_filter.penalty.timer
                    ) {
                        updateData['moderation.automoder.links_filter.penalty.timer'] = data.moderation.automoder.links_filter.penalty.timer
                    }

                    if (data.moderation.automoder.links_filter.penalty.message) {
                        if (
                            typeof data.moderation.automoder.links_filter.penalty.message.content === 'string' &&
                            data.moderation.automoder.links_filter.penalty.message.content !== guild.moderation.automoder.links_filter.penalty.message.content
                        ) {
                            updateData['moderation.automoder.links_filter.penalty.message.content'] = data.moderation.automoder.links_filter.penalty.message.content
                        }

                        if (data.moderation.automoder.links_filter.penalty.message.embed) {
                            const newEmbed = data.moderation.automoder.links_filter.penalty.message.embed
                            const oldEmbed = guild.moderation.automoder.links_filter.penalty.message.embed

                            if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                                updateData['moderation.automoder.links_filter.penalty.message.embed'] = {
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

                    if (
                        Array.isArray(data.moderation.automoder.links_filter.penalty.add_roles) &&
                        JSON.stringify(data.moderation.automoder.links_filter.penalty.add_roles) !==
                            JSON.stringify(guild.moderation.automoder.links_filter.penalty.add_roles)
                    ) {
                        updateData['moderation.automoder.links_filter.penalty.add_roles'] = data.moderation.automoder.links_filter.penalty.add_roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.links_filter.penalty.remove_roles) &&
                        JSON.stringify(data.moderation.automoder.links_filter.penalty.remove_roles) !==
                            JSON.stringify(guild.moderation.automoder.links_filter.penalty.remove_roles)
                    ) {
                        updateData['moderation.automoder.links_filter.penalty.remove_roles'] = data.moderation.automoder.links_filter.penalty.remove_roles
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
                        JSON.stringify(data.moderation.automoder.links_filter.ignored.roles) !== JSON.stringify(guild.moderation.automoder.links_filter.ignored.roles)
                    ) {
                        updateData['moderation.automoder.links_filter.ignored.roles'] = data.moderation.automoder.links_filter.ignored.roles
                    }

                    if (
                        typeof data.moderation.automoder.links_filter.ignored.permissions === 'number' &&
                        data.moderation.automoder.links_filter.ignored.permissions !== guild.moderation.automoder.links_filter.ignored.permissions
                    ) {
                        updateData['moderation.automoder.links_filter.ignored.permissions'] = data.moderation.automoder.links_filter.ignored.permissions
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
                    JSON.stringify(data.moderation.automoder.swear_filter.registry) !== JSON.stringify(guild.moderation.automoder.swear_filter.registry)
                ) {
                    updateData['moderation.automoder.swear_filter.registry'] = data.moderation.automoder.swear_filter.registry
                }

                if (data.moderation.automoder.swear_filter.penalty) {
                    if (
                        typeof data.moderation.automoder.swear_filter.penalty.action === 'number' &&
                        data.moderation.automoder.swear_filter.penalty.action !== guild.moderation.automoder.swear_filter.penalty.action
                    ) {
                        updateData['moderation.automoder.swear_filter.penalty.action'] = data.moderation.automoder.swear_filter.penalty.action
                    }

                    if (
                        typeof data.moderation.automoder.swear_filter.penalty.timer === 'number' &&
                        data.moderation.automoder.swear_filter.penalty.timer !== guild.moderation.automoder.swear_filter.penalty.timer
                    ) {
                        updateData['moderation.automoder.swear_filter.penalty.timer'] = data.moderation.automoder.swear_filter.penalty.timer
                    }

                    if (data.moderation.automoder.swear_filter.penalty.message) {
                        if (
                            typeof data.moderation.automoder.swear_filter.penalty.message.content === 'string' &&
                            data.moderation.automoder.swear_filter.penalty.message.content !== guild.moderation.automoder.swear_filter.penalty.message.content
                        ) {
                            updateData['moderation.automoder.swear_filter.penalty.message.content'] = data.moderation.automoder.swear_filter.penalty.message.content
                        }

                        if (data.moderation.automoder.swear_filter.penalty.message.embed) {
                            const newEmbed = data.moderation.automoder.swear_filter.penalty.message.embed
                            const oldEmbed = guild.moderation.automoder.swear_filter.penalty.message.embed

                            if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                                updateData['moderation.automoder.swear_filter.penalty.message.embed'] = {
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

                    if (
                        Array.isArray(data.moderation.automoder.swear_filter.penalty.add_roles) &&
                        JSON.stringify(data.moderation.automoder.swear_filter.penalty.add_roles) !==
                            JSON.stringify(guild.moderation.automoder.swear_filter.penalty.add_roles)
                    ) {
                        updateData['moderation.automoder.swear_filter.penalty.add_roles'] = data.moderation.automoder.swear_filter.penalty.add_roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.swear_filter.penalty.remove_roles) &&
                        JSON.stringify(data.moderation.automoder.swear_filter.penalty.remove_roles) !==
                            JSON.stringify(guild.moderation.automoder.swear_filter.penalty.remove_roles)
                    ) {
                        updateData['moderation.automoder.swear_filter.penalty.remove_roles'] = data.moderation.automoder.swear_filter.penalty.remove_roles
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
                        JSON.stringify(data.moderation.automoder.swear_filter.ignored.roles) !== JSON.stringify(guild.moderation.automoder.swear_filter.ignored.roles)
                    ) {
                        updateData['moderation.automoder.swear_filter.ignored.roles']
                    }

                    if (
                        typeof data.moderation.automoder.swear_filter.ignored.permissions === 'number' &&
                        data.moderation.automoder.swear_filter.ignored.permissions !== guild.moderation.automoder.swear_filter.ignored.permissions
                    ) {
                        updateData['moderation.automoder.swear_filter.ignored.permissions'] = data.moderation.automoder.swear_filter.ignored.permissions
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

                if (data.moderation.automoder.users_slowdown.penalty) {
                    if (
                        typeof data.moderation.automoder.users_slowdown.penalty.action === 'number' &&
                        data.moderation.automoder.users_slowdown.penalty.action !== guild.moderation.automoder.users_slowdown.penalty.action
                    ) {
                        updateData['moderation.automoder.users_slowdown.penalty.action'] = data.moderation.automoder.users_slowdown.penalty.action
                    }

                    if (
                        typeof data.moderation.automoder.users_slowdown.penalty.timer === 'number' &&
                        data.moderation.automoder.users_slowdown.penalty.timer !== guild.moderation.automoder.users_slowdown.penalty.timer
                    ) {
                        updateData['moderation.automoder.users_slowdown.penalty.timer'] = data.moderation.automoder.users_slowdown.penalty.timer
                    }

                    if (data.moderation.automoder.users_slowdown.penalty.message) {
                        if (
                            typeof data.moderation.automoder.users_slowdown.penalty.message.content === 'string' &&
                            data.moderation.automoder.users_slowdown.penalty.message.content !== guild.moderation.automoder.users_slowdown.penalty.message.content
                        ) {
                            updateData['moderation.automoder.users_slowdown.penalty.message.content'] = data.moderation.automoder.users_slowdown.penalty.message.content
                        }

                        if (data.moderation.automoder.users_slowdown.penalty.message.embed) {
                            const newEmbed = data.moderation.automoder.users_slowdown.penalty.message.embed
                            const oldEmbed = guild.moderation.automoder.users_slowdown.penalty.message.embed

                            if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                                updateData['moderation.automoder.users_slowdown.penalty.message.embed'] = {
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

                    if (
                        Array.isArray(data.moderation.automoder.users_slowdown.penalty.add_roles) &&
                        JSON.stringify(data.moderation.automoder.users_slowdown.penalty.add_roles) !==
                            JSON.stringify(guild.moderation.automoder.users_slowdown.penalty.add_roles)
                    ) {
                        updateData['moderation.automoder.users_slowdown.penalty.add_roles'] = data.moderation.automoder.users_slowdown.penalty.add_roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.users_slowdown.penalty.remove_roles) &&
                        JSON.stringify(data.moderation.automoder.users_slowdown.penalty.remove_roles) !==
                            JSON.stringify(guild.moderation.automoder.users_slowdown.penalty.remove_roles)
                    ) {
                        updateData['moderation.automoder.users_slowdown.penalty.remove_roles'] = data.moderation.automoder.users_slowdown.penalty.remove_roles
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
                        JSON.stringify(data.moderation.automoder.users_slowdown.ignored.roles) !== JSON.stringify(guild.moderation.automoder.users_slowdown.ignored.roles)
                    ) {
                        updateData['moderation.automoder.users_slowdown.ignored.roles'] = data.moderation.automoder.users_slowdown.ignored.roles
                    }

                    if (
                        typeof data.moderation.automoder.users_slowdown.ignored.permissions === 'number' &&
                        data.moderation.automoder.users_slowdown.ignored.permissions !== guild.moderation.automoder.users_slowdown.ignored.permissions
                    ) {
                        updateData['moderation.automoder.users_slowdown.ignored.permissions'] = data.moderation.automoder.users_slowdown.ignored.permissions
                    }
                }
            }

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
                    if (data.moderation.automoder.anti_caps.percentage_of_caps >= 1 && data.moderation.automoder.anti_caps.percentage_of_caps <= 100) {
                        updateData['moderation.automoder.anti_caps.percentage_of_caps'] = data.moderation.automoder.anti_caps.percentage_of_caps
                    }
                }

                if (
                    typeof data.moderation.automoder.anti_caps.minimum_content_length === 'number' &&
                    data.moderation.automoder.anti_caps.minimum_content_length !== guild.moderation.automoder.anti_caps.minimum_content_length
                ) {
                    updateData['moderation.automoder.anti_caps.minimum_content_length'] = data.moderation.automoder.anti_caps.minimum_content_length
                }

                if (data.moderation.automoder.anti_caps.penalty) {
                    if (
                        typeof data.moderation.automoder.anti_caps.penalty.action === 'number' &&
                        data.moderation.automoder.anti_caps.penalty.action !== guild.moderation.automoder.anti_caps.penalty.action
                    ) {
                        updateData['moderation.automoder.anti_caps.penalty.action'] = data.moderation.automoder.anti_caps.penalty.action
                    }

                    if (
                        typeof data.moderation.automoder.anti_caps.penalty.timer === 'number' &&
                        data.moderation.automoder.anti_caps.penalty.timer !== guild.moderation.automoder.anti_caps.penalty.timer
                    ) {
                        updateData['moderation.automoder.anti_caps.penalty.timer'] = data.moderation.automoder.anti_caps.penalty.timer
                    }

                    if (data.moderation.automoder.anti_caps.penalty.message) {
                        if (
                            typeof data.moderation.automoder.anti_caps.penalty.message.content === 'string' &&
                            data.moderation.automoder.anti_caps.penalty.message.content !== guild.moderation.automoder.anti_caps.penalty.message.content
                        ) {
                            updateData['moderation.automoder.anti_caps.penalty.message.content'] = data.moderation.automoder.anti_caps.penalty.message.content
                        }

                        if (data.moderation.automoder.anti_caps.penalty.message.embed) {
                            const newEmbed = data.moderation.automoder.anti_caps.penalty.message.embed
                            const oldEmbed = guild.moderation.automoder.anti_caps.penalty.message.embed

                            if (JSON.stringify(newEmbed) !== JSON.stringify(oldEmbed)) {
                                updateData['moderation.automoder.anti_caps.penalty.message.embed'] = {
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

                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.penalty.add_roles) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.penalty.add_roles) !== JSON.stringify(guild.moderation.automoder.anti_caps.penalty.add_roles)
                    ) {
                        updateData['moderation.automoder.anti_caps.penalty.add_roles'] = data.moderation.automoder.anti_caps.penalty.add_roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.penalty.remove_roles) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.penalty.remove_roles) !==
                            JSON.stringify(guild.moderation.automoder.anti_caps.penalty.remove_roles)
                    ) {
                        updateData['moderation.automoder.anti_caps.penalty.remove_roles'] = data.moderation.automoder.anti_caps.penalty.remove_roles
                    }
                }

                if (data.moderation.automoder.anti_caps.ignored) {
                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.ignored.channels) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.ignored.channels) !== JSON.stringify(guild.moderation.automoder.anti_caps.ignored.channels)
                    ) {
                        updateData['moderation.automoder.anti_caps.ignored.channels'] = data.moderation.automoder.anti_caps.ignored.channels
                    }

                    if (
                        Array.isArray(data.moderation.automoder.anti_caps.ignored.roles) &&
                        JSON.stringify(data.moderation.automoder.anti_caps.ignored.roles) !== JSON.stringify(guild.moderation.automoder.anti_caps.ignored.roles)
                    ) {
                        updateData['moderation.automoder.anti_caps.ignored.roles'] = data.moderation.automoder.anti_caps.ignored.roles
                    }

                    if (
                        typeof data.moderation.automoder.anti_caps.ignored.permissions === 'number' &&
                        data.moderation.automoder.anti_caps.ignored.permissions !== guild.moderation.automoder.anti_caps.ignored.permissions
                    ) {
                        updateData['moderation.automoder.anti_caps.ignored.permissions'] = data.moderation.automoder.anti_caps.ignored.permissions
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

                if (data.moderation.automoder.nicknames.types) {
                    if (
                        typeof data.moderation.automoder.nicknames.types.special_characters === 'boolean' &&
                        data.moderation.automoder.nicknames.types.special_characters !== guild.moderation.automoder.nicknames.types.special_characters
                    ) {
                        updateData['moderation.automoder.nicknames.types.special_characters'] = data.moderation.automoder.nicknames.types.special_characters
                    }

                    if (
                        typeof data.moderation.automoder.nicknames.types.zalgo === 'boolean' &&
                        data.moderation.automoder.nicknames.types.zalgo !== guild.moderation.automoder.nicknames.types.zalgo
                    ) {
                        updateData['moderation.automoder.nicknames.types.zalgo'] = data.moderation.automoder.nicknames.types.zalgo
                    }

                    if (
                        typeof data.moderation.automoder.nicknames.types.diacritics === 'boolean' &&
                        data.moderation.automoder.nicknames.types.diacritics !== guild.moderation.automoder.nicknames.types.diacritics
                    ) {
                        updateData['moderation.automoder.nicknames.types.diacritics'] = data.moderation.automoder.nicknames.types.diacritics
                    }

                    if (
                        typeof data.moderation.automoder.nicknames.types.emojis === 'boolean' &&
                        data.moderation.automoder.nicknames.types.emojis !== guild.moderation.automoder.nicknames.types.emojis
                    ) {
                        updateData['moderation.automoder.nicknames.types.emojis'] = data.moderation.automoder.nicknames.types.emojis
                    }

                    if (
                        Array.isArray(data.moderation.automoder.nicknames.types.contains) &&
                        JSON.stringify(data.moderation.automoder.nicknames.types.contains) !== JSON.stringify(guild.moderation.automoder.nicknames.types.contains)
                    ) {
                        updateData['moderation.automoder.nicknames.types.contains'] = data.moderation.automoder.nicknames.types.contains
                    }
                }

                if (data.moderation.automoder.nicknames.ignored) {
                    if (
                        Array.isArray(data.moderation.automoder.nicknames.ignored.roles) &&
                        JSON.stringify(data.moderation.automoder.nicknames.ignored.roles) !== JSON.stringify(guild.moderation.automoder.nicknames.ignored.roles)
                    ) {
                        updateData['moderation.automoder.nicknames.ignored.roles'] = data.moderation.automoder.nicknames.ignored.roles
                    }

                    if (
                        typeof data.moderation.automoder.nicknames.ignored.permissions === 'number' &&
                        data.moderation.automoder.nicknames.ignored.permissions !== guild.moderation.automoder.nicknames.ignored.permissions
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
                    data.moderation.automoder.newbies.minimum_account_age.measure !== guild.moderation.automoder.newbies.minimum_account_age.measure &&
                    ['MINUTES', 'HOURS', 'DAYS'].includes(data.moderation.automoder.newbies.minimum_account_age.measure)
                ) {
                    updateData['moderation.automoder.newbies.minimum_account_age.measure'] = data.moderation.automoder.newbies.minimum_account_age.measure
                }

                if (data.moderation.automoder.newbies.penalty) {
                    if (
                        typeof data.moderation.automoder.newbies.penalty.action === 'number' &&
                        data.moderation.automoder.newbies.penalty.action !== guild.moderation.automoder.newbies.penalty.action
                    ) {
                        updateData['moderation.automoder.newbies.penalty.action'] = data.moderation.automoder.newbies.penalty.action
                    }

                    if (
                        typeof data.moderation.automoder.newbies.penalty.timer === 'number' &&
                        data.moderation.automoder.newbies.penalty.timer !== guild.moderation.automoder.newbies.penalty.timer
                    ) {
                        updateData['moderation.automoder.newbies.penalty.timer'] = data.moderation.automoder.newbies.penalty.timer
                    }

                    if (
                        Array.isArray(data.moderation.automoder.newbies.penalty.add_roles) &&
                        JSON.stringify(data.moderation.automoder.newbies.penalty.add_roles) !== JSON.stringify(guild.moderation.automoder.newbies.penalty.add_roles)
                    ) {
                        updateData['moderation.automoder.newbies.penalty.add_roles'] = data.moderation.automoder.newbies.penalty.add_roles
                    }

                    if (
                        Array.isArray(data.moderation.automoder.newbies.penalty.remove_roles) &&
                        JSON.stringify(data.moderation.automoder.newbies.penalty.remove_roles) !== JSON.stringify(guild.moderation.automoder.newbies.penalty.remove_roles)
                    ) {
                        updateData['moderation.automoder.newbies.penalty.remove_roles'] = data.moderation.automoder.newbies.penalty.remove_roles
                    }
                }
            }
        }

        if (typeof data.moderation.use_timeout_mute === 'boolean' && data.moderation.use_timeout_mute !== guild.moderation.use_timeout_mute) {
            updateData['moderation.use_timeout_mute'] = data.moderation.use_timeout_mute
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
                if (typeof data.modules.welcome.message.content === 'string' && data.modules.welcome.message.content !== guild.modules.welcome.message.content) {
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
                if (typeof data.modules.farewell.message.content === 'string' && data.modules.farewell.message.content !== guild.modules.farewell.message.content) {
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
            }
        }

        if (data.modules.levels) {
            if (typeof data.modules.levels.active === 'boolean' && data.modules.levels.active !== guild.modules.levels.active) {
                updateData['modules.levels.active'] = data.modules.levels.active
            }

            if (typeof data.modules.levels.voice === 'boolean' && data.modules.levels.voice !== guild.modules.levels.voice) {
                updateData['modules.levels.voice'] = data.modules.levels.voice
            }

            if (typeof data.modules.levels.reset_on_leave === 'boolean' && data.modules.levels.reset_on_leave !== guild.modules.levels.reset_on_leave) {
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
                }
            }

            if (Array.isArray(data.modules.levels.awards) && JSON.stringify(data.modules.levels.awards) !== JSON.stringify(guild.modules.levels.awards)) {
                updateData['modules.levels.awards'] = data.modules.levels.awards.slice(0, guild.server.premium.available ? 200 : 50)
            }
        }

        if (data.modules.restoring) {
            if (typeof data.modules.restoring.restore_nicknames === 'boolean' && data.modules.restoring.restore_nicknames !== guild.modules.restoring.restore_nicknames) {
                updateData['modules.restoring.restore_nicknames'] = data.modules.restoring.restore_nicknames
            }

            if (typeof data.modules.restoring.restore_roles === 'boolean' && data.modules.restoring.restore_roles !== guild.modules.restoring.restore_roles) {
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
                guild.server.premium.available
            ) {
                updateData['modules.music.allow_radio_playback'] = data.modules.music.allow_radio_playback
            }

            if (
                typeof data.modules.music.queue_max_length === 'number' &&
                data.modules.music.queue_max_length !== guild.modules.music.queue_max_length &&
                guild.server.premium.available
            ) {
                updateData['modules.music.queue_max_length'] = data.modules.music.queue_max_length
            }

            if (
                typeof data.modules.music.default_volume === 'number' &&
                data.modules.music.default_volume !== guild.modules.music.default_volume &&
                guild.server.premium.available
            ) {
                updateData['modules.music.default_volume'] = data.modules.music.default_volume
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
        }

        if (Array.isArray(data.modules.autoreactions) && JSON.stringify(data.modules.autoreactions) !== JSON.stringify(guild.modules.autoreactions)) {
            for (const reaction of data.modules.autoreactions.slice(0, guild.server.premium.available ? 20 : 2)) {
                reaction.reactions
                    .filter(emoji => !emoji.name)
                    .forEach(emoji => {
                        const index = reaction.reactions.indexOf(emoji)
                        reaction.reactions[index] = Util.parseEmoji(emoji as any)
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
