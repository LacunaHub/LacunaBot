import Servers, { ReactionElement, ServerDocument, TwitchChannel, VoiceChannelTrigger, YouTubeChannel } from '../../../database/schemas/Servers'
import db from '../../../database'
import { generateId } from '../../../modules/Reactions'
import { Util } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { DataResolver } from 'discord.js'
import qdb from 'quick.db'
import { resolveObjectPath, createEnum, dotNotateObject } from '../../utility/Utils'
import translator from '../../locale'
import { eventSubSubscribe, eventSubUnsubscribe, ITwitchIncomingWebhook } from '../../../modules/Twitch'
import { hubSubscribe } from '../../../modules/YouTube'

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN)

const command_option_types = createEnum([ null, 'SUB_COMMAND', 'SUB_COMMAND_GROUP', 'STRING', 'INTEGER', 'BOOLEAN', 'USER', 'CHANNEL', 'ROLE', 'MENTIONABLE', 'NUMBER' ])

export async function isBotExpert(guild_id: string, user_id: string): Promise<boolean> {
    const server: ServerDocument = await Servers.findOne({ _id: guild_id })
    const member = await rest.get(Routes.guildMember(guild_id, user_id)).catch(() => {}) as any

    return server && member ? member.roles.some(r => server.server.bot_expert_roles.includes(r)) : false
}

export async function updateSettings(guild: ServerDocument, data: Partial<ServerDocument>, user_id: string): Promise<ServerDocument> {
    if (typeof data.prefix == 'string' && data.prefix != guild.prefix) {
        if (data.prefix.length && data.prefix.length <= 3 && !['/'].includes(data.prefix)) {
            await Servers.updateOne({ _id: guild._id }, { $set: { 'prefix': data.prefix } })
        }
    }

    if (typeof data.locale == 'string' && data.locale != guild.locale) {
        const locales = ['ru', 'en']
        if (locales.includes(data.locale)) {
            await Servers.updateOne({ _id: guild._id }, { $set: { 'locale': data.locale } })
        }
    }

    if (Array.isArray(data.server?.bot_expert_roles) && JSON.stringify(data.server.bot_expert_roles) != JSON.stringify(guild.server.bot_expert_roles)) {
        await Servers.updateOne({ _id: guild._id }, { $set: { 'server.bot_expert_roles': data.server.bot_expert_roles } })
    }

    if (data.commands) {
        if (Array.isArray(data.commands.system) && data.commands.system.length) {
            await Servers.updateOne({ _id: guild._id }, { $set: { 'commands.system': data.commands.system } })
        }

        if (Array.isArray(data.commands.custom)) {
            data.commands.custom = data.commands.custom.slice(0, 100)
            data.commands.custom = [ ...new Map(data.commands.custom.map(c => [c.name.toLowerCase(), c])).values() ]
            
            await Servers.updateOne({ _id: guild._id }, { $set: { 'commands.custom': data.commands.custom } })
        }

        if ((typeof data.commands.slash_commands == 'boolean' && data.commands.slash_commands) || (guild.commands.slash_commands && Array.isArray(data.commands.system))) {
            const data_commands = data.commands.system?.length ? data.commands.system : guild.commands.system
            const locale = translator.locale(data.locale ?? guild.locale)

            let commands = qdb.get('commands')

            const slash = commands.filter(c => c.is_slash_command && !data_commands.find(sc => sc.name == c.name)?.inactive).map(c => {
                return {
                    name: c.name,
                    description: resolveObjectPath(c.description, locale),
                    type: 1,
                    options: c?.options?.map(option => {
                        if (option.type == 'SUB_COMMAND') return {
                            ...option,
                            type: command_option_types[option.type],
                            description: resolveObjectPath(option.description, locale),
                            options: option.options?.map(o => {
                                return {
                                    ...o,
                                    type: command_option_types[o.type],
                                    name: resolveObjectPath(o.name, locale),
                                    description: resolveObjectPath(o.description, locale),
                                    choices: option.choices?.length ? option.choices.map(oc => { return { ...oc, name: resolveObjectPath(oc.name, locale) } }) : null
                                }
                            }) ?? []
                        }
    
                        return {
                            ...option,
                            type: command_option_types[option.type],
                            name: resolveObjectPath(option.name, locale),
                            description: resolveObjectPath(option.description, locale),
                            choices: option.choices?.length ? option.choices.map(oc => { return { ...oc, name: resolveObjectPath(oc.name, locale) } }) : null
                        }
                    }) ?? []
                }
            })

            const message = commands.filter(c => c.is_message_command && !data_commands.find(sc => sc.name == c.name)?.inactive).map(c => {
                return {
                    name: resolveObjectPath(c.pretty_name, locale),
                    type: 3
                }
            })

            const user = commands.filter(c => c.is_user_command && !data_commands.find(sc => sc.name == c.name)?.inactive).map(c => {
                return {
                    name: resolveObjectPath(c.pretty_name, locale),
                    type: 2
                }
            })

            commands = [ ...slash, ...message, ...user ]

            const res = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild._id), {
                body: commands
            }).catch(console.error)

            if (typeof res != 'undefined' && typeof data.commands.slash_commands == 'boolean') {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'commands.slash_commands': data.commands.slash_commands } })
            }
        }

        if (typeof data.commands.slash_commands == 'boolean' && !data.commands.slash_commands) {
            const res = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild._id), { body: [] }).catch(() => {})
            
            if (typeof res != 'undefined') {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'commands.slash_commands': data.commands.slash_commands } })
            }
        }
    }

    if (data.moderation) {
        if (data.moderation.case_log) {
            if ((typeof data.moderation.case_log.channel_id == 'string' || data.moderation.case_log.channel_id === null) && data.moderation.case_log.channel_id != guild.moderation.case_log.channel_id) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.case_log.channel_id': data.moderation.case_log.channel_id || '' } })
            }

            if (typeof data.moderation.case_log.case_types == 'object') {
                const data_case_types = Object.values(data.moderation.case_log.case_types)
                const guild_case_types = Object.values(guild.moderation.case_log.case_types)

                if (data_case_types.some((v, i) => v !== guild_case_types[i])) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.case_log.case_types': data.moderation.case_log.case_types } })
                }
            }

            if (typeof data.moderation.case_log.case_types_messages == 'object') {
                for (const type of Object.keys(data.moderation.case_log.case_types_messages)) {
                    if (JSON.stringify(data.moderation.case_log.case_types_messages[type]) != JSON.stringify(guild.moderation.case_log.case_types_messages[type])) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { [`moderation.case_log.case_types_messages.${type}`]: data.moderation.case_log.case_types_messages[type] } })
                    }
                }
            }
        }

        if (data.moderation.logs) {
            if (typeof data.moderation.logs.types == 'object') {
                const data_logs = Object.keys(data.moderation.logs.types)

                for (const log of data_logs) {
                    if (data.moderation.logs.types[log].active != guild.moderation.logs.types[log].active || data.moderation.logs.types[log].channel_id != guild.moderation.logs.types[log].channel_id) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { [`moderation.logs.types.${log}`]: { active: data.moderation.logs.types[log].active, channel_id: data.moderation.logs.types[log].channel_id } } })
                    }
                }
            }
        }

        if (data.moderation.roles) {
            if ((typeof data.moderation.roles.mute === 'string' || data.moderation.roles.mute === null) && data.moderation.roles.mute !== guild.moderation.roles.mute) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.roles.mute': data.moderation.roles.mute || '' } })
            }

            if (data.moderation.roles.on_mute) {
                if (typeof data.moderation.roles.on_mute.remove_all_roles === 'boolean' && data.moderation.roles.on_mute.remove_all_roles !== guild.moderation.roles.on_mute.remove_all_roles) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.roles.on_mute.remove_all_roles': data.moderation.roles.on_mute.remove_all_roles } })
                }

                if (Array.isArray(data.moderation.roles.on_mute.strict_roles)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.roles.on_mute.strict_roles': data.moderation.roles.on_mute.strict_roles } })
                }
            }
        }

        if (data.moderation.warnings) {
            if (Array.isArray(data.moderation.warnings.penalties))
                await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.warnings.penalties': data.moderation.warnings.penalties.slice(0, 100) } })
        }

        if (data.moderation.automoder) {
            if (data.moderation.automoder.links_filter) {
                if (typeof data.moderation.automoder.links_filter.active === 'boolean' && data.moderation.automoder.links_filter.active !== guild.moderation.automoder.links_filter.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.active': data.moderation.automoder.links_filter.active } })
                }

                if (Array.isArray(data.moderation.automoder.links_filter.registry)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.registry': data.moderation.automoder.links_filter.registry } })
                }

                if (Array.isArray(data.moderation.automoder.links_filter.allowed_registry)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.allowed_registry': data.moderation.automoder.links_filter.allowed_registry } })
                }

                if (typeof data.moderation.automoder.links_filter.delete_all_links === 'boolean' && data.moderation.automoder.links_filter.delete_all_links !== guild.moderation.automoder.links_filter.delete_all_links) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.delete_all_links': data.moderation.automoder.links_filter.delete_all_links } })
                }

                if (typeof data.moderation.automoder.links_filter.delete_referral_invites === 'boolean' && data.moderation.automoder.links_filter.delete_referral_invites !== guild.moderation.automoder.links_filter.delete_referral_invites) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.delete_referral_invites': data.moderation.automoder.links_filter.delete_referral_invites } })
                }

                if (data.moderation.automoder.links_filter.penalty) {
                    if (typeof data.moderation.automoder.links_filter.penalty.action === 'number' && data.moderation.automoder.links_filter.penalty.action !== guild.moderation.automoder.links_filter.penalty.action) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.penalty.action': data.moderation.automoder.links_filter.penalty.action } })
                    }

                    if (typeof data.moderation.automoder.links_filter.penalty.timer === 'number' && data.moderation.automoder.links_filter.penalty.timer !== guild.moderation.automoder.links_filter.penalty.timer) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.penalty.timer': data.moderation.automoder.links_filter.penalty.timer } })
                    }

                    if (data.moderation.automoder.links_filter.penalty.message) {
                        if (typeof data.moderation.automoder.links_filter.penalty.message.content === 'string' && data.moderation.automoder.links_filter.penalty.message.content !== guild.moderation.automoder.links_filter.penalty.message.content) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.penalty.message.content': data.moderation.automoder.links_filter.penalty.message.content } })
                        }

                        if (data.moderation.automoder.links_filter.penalty.message.embed) {
                            const newEmbed = data.moderation.automoder.links_filter.penalty.message.embed
                            const oldEmbed = guild.moderation.automoder.links_filter.penalty.message.embed
        
                            await Servers.updateOne({ _id: guild._id }, {
                                $set: {
                                    'moderation.automoder.links_filter.penalty.message.embed': {
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
                            })
                        }
                    }

                    if (Array.isArray(data.moderation.automoder.links_filter.penalty.add_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.penalty.add_roles': data.moderation.automoder.links_filter.penalty.add_roles } })
                    }

                    if (Array.isArray(data.moderation.automoder.links_filter.penalty.remove_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.penalty.remove_roles': data.moderation.automoder.links_filter.penalty.remove_roles } })
                    }
                }

                if (data.moderation.automoder.links_filter.ignored) {
                    if (Array.isArray(data.moderation.automoder.links_filter.ignored.channels)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.ignored.channels': data.moderation.automoder.links_filter.ignored.channels } })
                    }

                    if (Array.isArray(data.moderation.automoder.links_filter.ignored.roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.ignored.roles': data.moderation.automoder.links_filter.ignored.roles } })
                    }

                    if (typeof data.moderation.automoder.links_filter.ignored.permissions === 'number' && data.moderation.automoder.links_filter.ignored.permissions !== guild.moderation.automoder.links_filter.ignored.permissions) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.links_filter.ignored.permissions': data.moderation.automoder.links_filter.ignored.permissions } })
                    }
                }
            }

            if (data.moderation.automoder.swear_filter) {
                if (typeof data.moderation.automoder.swear_filter.active === 'boolean' && data.moderation.automoder.swear_filter.active !== guild.moderation.automoder.swear_filter.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.active': data.moderation.automoder.swear_filter.active } })
                }

                if (Array.isArray(data.moderation.automoder.swear_filter.registry)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.registry': data.moderation.automoder.swear_filter.registry } })
                }

                if (data.moderation.automoder.swear_filter.penalty) {
                    if (typeof data.moderation.automoder.swear_filter.penalty.action === 'number' && data.moderation.automoder.swear_filter.penalty.action !== guild.moderation.automoder.swear_filter.penalty.action) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.penalty.action': data.moderation.automoder.swear_filter.penalty.action } })
                    }

                    if (typeof data.moderation.automoder.swear_filter.penalty.timer === 'number' && data.moderation.automoder.swear_filter.penalty.timer !== guild.moderation.automoder.swear_filter.penalty.timer) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.penalty.timer': data.moderation.automoder.swear_filter.penalty.timer } })
                    }

                    if (data.moderation.automoder.swear_filter.penalty.message) {
                        if (typeof data.moderation.automoder.swear_filter.penalty.message.content === 'string' && data.moderation.automoder.swear_filter.penalty.message.content !== guild.moderation.automoder.swear_filter.penalty.message.content) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.penalty.message.content': data.moderation.automoder.swear_filter.penalty.message.content } })
                        }

                        if (data.moderation.automoder.swear_filter.penalty.message.embed) {
                            const newEmbed = data.moderation.automoder.swear_filter.penalty.message.embed
                            const oldEmbed = guild.moderation.automoder.swear_filter.penalty.message.embed
        
                            await Servers.updateOne({ _id: guild._id }, {
                                $set: {
                                    'moderation.automoder.swear_filter.penalty.message.embed': {
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
                            })
                        }
                    }

                    if (Array.isArray(data.moderation.automoder.swear_filter.penalty.add_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.penalty.add_roles': data.moderation.automoder.swear_filter.penalty.add_roles } })
                    }

                    if (Array.isArray(data.moderation.automoder.swear_filter.penalty.remove_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.penalty.remove_roles': data.moderation.automoder.swear_filter.penalty.remove_roles } })
                    }
                }

                if (data.moderation.automoder.swear_filter.ignored) {
                    if (Array.isArray(data.moderation.automoder.swear_filter.ignored.channels)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.ignored.channels': data.moderation.automoder.swear_filter.ignored.channels } })
                    }

                    if (Array.isArray(data.moderation.automoder.swear_filter.ignored.roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.ignored.roles': data.moderation.automoder.swear_filter.ignored.roles } })
                    }

                    if (typeof data.moderation.automoder.swear_filter.ignored.permissions === 'number' && data.moderation.automoder.swear_filter.ignored.permissions !== guild.moderation.automoder.swear_filter.ignored.permissions) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.swear_filter.ignored.permissions': data.moderation.automoder.swear_filter.ignored.permissions } })
                    }
                }
            }

            if (data.moderation.automoder.users_slowdown) {
                if (typeof data.moderation.automoder.users_slowdown.active === 'boolean' && data.moderation.automoder.users_slowdown.active !== guild.moderation.automoder.users_slowdown.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.active': data.moderation.automoder.users_slowdown.active } })
                }

                if (typeof data.moderation.automoder.users_slowdown.messages_limit === 'number' && data.moderation.automoder.users_slowdown.messages_limit !== guild.moderation.automoder.users_slowdown.messages_limit) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.messages_limit': data.moderation.automoder.users_slowdown.messages_limit } })
                }

                if (data.moderation.automoder.users_slowdown.penalty) {
                    if (typeof data.moderation.automoder.users_slowdown.penalty.action === 'number' && data.moderation.automoder.users_slowdown.penalty.action !== guild.moderation.automoder.users_slowdown.penalty.action) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.penalty.action': data.moderation.automoder.users_slowdown.penalty.action } })
                    }

                    if (typeof data.moderation.automoder.users_slowdown.penalty.timer === 'number' && data.moderation.automoder.users_slowdown.penalty.timer !== guild.moderation.automoder.users_slowdown.penalty.timer) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.penalty.timer': data.moderation.automoder.users_slowdown.penalty.timer } })
                    }

                    if (data.moderation.automoder.users_slowdown.penalty.message) {
                        if (typeof data.moderation.automoder.users_slowdown.penalty.message.content === 'string' && data.moderation.automoder.users_slowdown.penalty.message.content !== guild.moderation.automoder.users_slowdown.penalty.message.content) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.penalty.message.content': data.moderation.automoder.users_slowdown.penalty.message.content } })
                        }

                        if (data.moderation.automoder.users_slowdown.penalty.message.embed) {
                            const newEmbed = data.moderation.automoder.users_slowdown.penalty.message.embed
                            const oldEmbed = guild.moderation.automoder.users_slowdown.penalty.message.embed
        
                            await Servers.updateOne({ _id: guild._id }, {
                                $set: {
                                    'moderation.automoder.users_slowdown.penalty.message.embed': {
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
                            })
                        }
                    }

                    if (Array.isArray(data.moderation.automoder.users_slowdown.penalty.add_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.penalty.add_roles': data.moderation.automoder.users_slowdown.penalty.add_roles } })
                    }

                    if (Array.isArray(data.moderation.automoder.users_slowdown.penalty.remove_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.penalty.remove_roles': data.moderation.automoder.users_slowdown.penalty.remove_roles } })
                    }
                }

                if (data.moderation.automoder.users_slowdown.ignored) {
                    if (Array.isArray(data.moderation.automoder.users_slowdown.ignored.channels)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.ignored.channels': data.moderation.automoder.users_slowdown.ignored.channels } })
                    }

                    if (Array.isArray(data.moderation.automoder.users_slowdown.ignored.roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.ignored.roles': data.moderation.automoder.users_slowdown.ignored.roles } })
                    }

                    if (typeof data.moderation.automoder.users_slowdown.ignored.permissions === 'number' && data.moderation.automoder.users_slowdown.ignored.permissions !== guild.moderation.automoder.users_slowdown.ignored.permissions) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.users_slowdown.ignored.permissions': data.moderation.automoder.users_slowdown.ignored.permissions } })
                    }
                }
            }

            if (data.moderation.automoder.anti_caps) {
                if (typeof data.moderation.automoder.anti_caps.active === 'boolean' && data.moderation.automoder.anti_caps.active !== guild.moderation.automoder.anti_caps.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.active': data.moderation.automoder.anti_caps.active } })
                }

                if (typeof data.moderation.automoder.anti_caps.percentage_of_caps === 'number' && data.moderation.automoder.anti_caps.percentage_of_caps !== guild.moderation.automoder.anti_caps.percentage_of_caps) {
                    if (data.moderation.automoder.anti_caps.percentage_of_caps >= 1 && data.moderation.automoder.anti_caps.percentage_of_caps <= 100)
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.percentage_of_caps': data.moderation.automoder.anti_caps.percentage_of_caps } })
                }

                if (typeof data.moderation.automoder.anti_caps.minimum_content_length === 'number' && data.moderation.automoder.anti_caps.minimum_content_length !== guild.moderation.automoder.anti_caps.minimum_content_length) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.minimum_content_length': data.moderation.automoder.anti_caps.minimum_content_length } })
                }

                if (data.moderation.automoder.anti_caps.penalty) {
                    if (typeof data.moderation.automoder.anti_caps.penalty.action === 'number' && data.moderation.automoder.anti_caps.penalty.action !== guild.moderation.automoder.anti_caps.penalty.action) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.penalty.action': data.moderation.automoder.anti_caps.penalty.action } })
                    }

                    if (typeof data.moderation.automoder.anti_caps.penalty.timer === 'number' && data.moderation.automoder.anti_caps.penalty.timer !== guild.moderation.automoder.anti_caps.penalty.timer) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.penalty.timer': data.moderation.automoder.anti_caps.penalty.timer } })
                    }

                    if (data.moderation.automoder.anti_caps.penalty.message) {
                        if (typeof data.moderation.automoder.anti_caps.penalty.message.content === 'string' && data.moderation.automoder.anti_caps.penalty.message.content !== guild.moderation.automoder.anti_caps.penalty.message.content) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.penalty.message.content': data.moderation.automoder.anti_caps.penalty.message.content } })
                        }

                        if (data.moderation.automoder.anti_caps.penalty.message.embed) {
                            const newEmbed = data.moderation.automoder.anti_caps.penalty.message.embed
                            const oldEmbed = guild.moderation.automoder.anti_caps.penalty.message.embed
        
                            await Servers.updateOne({ _id: guild._id }, {
                                $set: {
                                    'moderation.automoder.anti_caps.penalty.message.embed': {
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
                            })
                        }
                    }

                    if (Array.isArray(data.moderation.automoder.anti_caps.penalty.add_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.penalty.add_roles': data.moderation.automoder.anti_caps.penalty.add_roles } })
                    }

                    if (Array.isArray(data.moderation.automoder.anti_caps.penalty.remove_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.penalty.remove_roles': data.moderation.automoder.anti_caps.penalty.remove_roles } })
                    }
                }

                if (data.moderation.automoder.anti_caps.ignored) {
                    if (Array.isArray(data.moderation.automoder.anti_caps.ignored.channels)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.ignored.channels': data.moderation.automoder.anti_caps.ignored.channels } })
                    }

                    if (Array.isArray(data.moderation.automoder.anti_caps.ignored.roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.ignored.roles': data.moderation.automoder.anti_caps.ignored.roles } })
                    }

                    if (typeof data.moderation.automoder.anti_caps.ignored.permissions === 'number' && data.moderation.automoder.anti_caps.ignored.permissions !== guild.moderation.automoder.anti_caps.ignored.permissions) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.anti_caps.ignored.permissions': data.moderation.automoder.anti_caps.ignored.permissions } })
                    }
                }
            }

            if (data.moderation.automoder.nicknames) {
                if (typeof data.moderation.automoder.nicknames.active === 'boolean' && data.moderation.automoder.nicknames.active !== guild.moderation.automoder.nicknames.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.active': data.moderation.automoder.nicknames.active } })
                }

                if (data.moderation.automoder.nicknames.types) {
                    if (typeof data.moderation.automoder.nicknames.types.special_characters === 'boolean' && data.moderation.automoder.nicknames.types.special_characters !== guild.moderation.automoder.nicknames.types.special_characters) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.types.special_characters': data.moderation.automoder.nicknames.types.special_characters } })
                    }

                    if (typeof data.moderation.automoder.nicknames.types.zalgo === 'boolean' && data.moderation.automoder.nicknames.types.zalgo !== guild.moderation.automoder.nicknames.types.zalgo) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.types.zalgo': data.moderation.automoder.nicknames.types.zalgo } })
                    }

                    if (typeof data.moderation.automoder.nicknames.types.diacritics === 'boolean' && data.moderation.automoder.nicknames.types.diacritics !== guild.moderation.automoder.nicknames.types.diacritics) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.types.diacritics': data.moderation.automoder.nicknames.types.diacritics } })
                    }

                    if (typeof data.moderation.automoder.nicknames.types.emojis === 'boolean' && data.moderation.automoder.nicknames.types.emojis !== guild.moderation.automoder.nicknames.types.emojis) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.types.emojis': data.moderation.automoder.nicknames.types.emojis } })
                    }

                    if (Array.isArray(data.moderation.automoder.nicknames.types.contains)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.types.contains': data.moderation.automoder.nicknames.types.contains } })
                    }
                }

                if (data.moderation.automoder.nicknames.ignored) {
                    if (Array.isArray(data.moderation.automoder.nicknames.ignored.roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.ignored.roles': data.moderation.automoder.nicknames.ignored.roles } })
                    }

                    if (typeof data.moderation.automoder.nicknames.ignored.permissions === 'number' && data.moderation.automoder.nicknames.ignored.permissions !== guild.moderation.automoder.nicknames.ignored.permissions) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.ignored.permissions': data.moderation.automoder.nicknames.ignored.permissions } })
                    }

                    if (typeof data.moderation.automoder.nicknames.ignored.bots === 'boolean' && data.moderation.automoder.nicknames.ignored.bots !== guild.moderation.automoder.nicknames.ignored.bots) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.ignored.bots': data.moderation.automoder.nicknames.ignored.bots } })
                    }
                }
            }

            if (data.moderation.automoder.newbies) {
                if (typeof data.moderation.automoder.newbies.active === 'boolean' && data.moderation.automoder.newbies.active !== guild.moderation.automoder.newbies.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.newbies.active': data.moderation.automoder.newbies.active } })
                }

                if (typeof data.moderation.automoder.newbies.minimum_account_age?.value === 'number' && data.moderation.automoder.newbies.minimum_account_age.value !== guild.moderation.automoder.newbies.minimum_account_age.value) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.newbies.minimum_account_age.value': data.moderation.automoder.newbies.minimum_account_age.value } })
                }

                if (typeof data.moderation.automoder.newbies.minimum_account_age?.measure === 'string' && data.moderation.automoder.newbies.minimum_account_age.measure !== guild.moderation.automoder.newbies.minimum_account_age.measure) {
                    if (['MINUTES', 'HOURS', 'DAYS'].includes(data.moderation.automoder.newbies.minimum_account_age.measure))
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.newbies.minimum_account_age.measure': data.moderation.automoder.newbies.minimum_account_age.measure } })
                }

                if (data.moderation.automoder.newbies.penalty) {
                    if (typeof data.moderation.automoder.newbies.penalty.action === 'number' && data.moderation.automoder.newbies.penalty.action !== guild.moderation.automoder.newbies.penalty.action) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.newbies.penalty.action': data.moderation.automoder.newbies.penalty.action } })
                    }

                    if (typeof data.moderation.automoder.newbies.penalty.timer === 'number' && data.moderation.automoder.newbies.penalty.timer !== guild.moderation.automoder.newbies.penalty.timer) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.newbies.penalty.timer': data.moderation.automoder.newbies.penalty.timer } })
                    }

                    if (Array.isArray(data.moderation.automoder.newbies.penalty.add_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.newbies.penalty.add_roles': data.moderation.automoder.newbies.penalty.add_roles } })
                    }

                    if (Array.isArray(data.moderation.automoder.newbies.penalty.remove_roles)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.newbies.penalty.remove_roles': data.moderation.automoder.newbies.penalty.remove_roles } })
                    }
                }
            }
        }

        if (typeof data.moderation.use_timeout_mute == 'boolean' && data.moderation.use_timeout_mute !== guild.moderation.use_timeout_mute) {
            await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.use_timeout_mute': data.moderation.use_timeout_mute } })
        }
    }

    if (data.modules) {
        if (data.modules.welcome) {
            if (typeof data.modules.welcome.active === 'boolean' && data.modules.welcome.active !== guild.modules.welcome.active) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.welcome.active': data.modules.welcome.active } })
            }

            if (typeof data.modules.welcome.format === 'string' && data.modules.welcome.format !== guild.modules.welcome.format) {
                if (['DM', 'CHANNEL'].includes(data.modules.welcome.format)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.welcome.format': data.modules.welcome.format } })
                }
            }

            if (typeof data.modules.welcome.channel_id === 'string' && data.modules.welcome.channel_id !== guild.modules.welcome.channel_id) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.welcome.channel_id': data.modules.welcome.channel_id } })
            }

            if (data.modules.welcome.message) {
                if (typeof data.modules.welcome.message.content === 'string' && data.modules.welcome.message.content !== guild.modules.welcome.message.content) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.welcome.message.content': data.modules.welcome.message.content } })
                }

                if (data.modules.welcome.message.embed) {
                    const newEmbed = data.modules.welcome.message.embed
                    const oldEmbed = guild.modules.welcome.message.embed

                    await Servers.updateOne({ _id: guild._id }, {
                        $set: {
                            'modules.welcome.message.embed': {
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
                    })
                }
            }

            if (data.modules.welcome.initial_roles) {
                if (typeof data.modules.welcome.initial_roles.active === 'boolean' && data.modules.welcome.initial_roles.active !== guild.modules.welcome.initial_roles.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.welcome.initial_roles.active': data.modules.welcome.initial_roles.active } })
                }

                if (Array.isArray(data.modules.welcome.initial_roles.roles)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.welcome.initial_roles.roles': data.modules.welcome.initial_roles.roles } })
                }
            }
        }

        if (data.modules.farewell) {
            if (typeof data.modules.farewell.active === 'boolean' && data.modules.farewell.active !== guild.modules.farewell.active) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.farewell.active': data.modules.farewell.active } })
            }

            if (typeof data.modules.farewell.format === 'string' && data.modules.farewell.format !== guild.modules.farewell.format) {
                if (['DM', 'CHANNEL'].includes(data.modules.farewell.format)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.farewell.format': data.modules.farewell.format } })
                }
            }

            if (typeof data.modules.farewell.channel_id === 'string' && data.modules.farewell.channel_id !== guild.modules.farewell.channel_id) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.farewell.channel_id': data.modules.farewell.channel_id } })
            }

            if (data.modules.farewell.message) {
                if (typeof data.modules.farewell.message.content === 'string' && data.modules.farewell.message.content !== guild.modules.farewell.message.content) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.farewell.message.content': data.modules.farewell.message.content } })
                }

                if (data.modules.farewell.message.embed) {
                    const newEmbed = data.modules.farewell.message.embed
                    const oldEmbed = guild.modules.farewell.message.embed

                    await Servers.updateOne({ _id: guild._id }, {
                        $set: {
                            'modules.farewell.message.embed': {
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
                    })
                }
            }
        }

        if (data.modules.levels) {
            if (typeof data.modules.levels.active === 'boolean' && data.modules.levels.active !== guild.modules.levels.active) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.active': data.modules.levels.active } })
            }

            if (typeof data.modules.levels.voice === 'boolean' && data.modules.levels.voice !== guild.modules.levels.voice) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.voice': data.modules.levels.voice } })
            }

            if (typeof data.modules.levels.single_roles === 'boolean' && data.modules.levels.single_roles !== guild.modules.levels.single_roles) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.single_roles': data.modules.levels.single_roles } })
            }

            if (typeof data.modules.levels.reset_on_leave === 'boolean' && data.modules.levels.reset_on_leave !== guild.modules.levels.reset_on_leave) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.reset_on_leave': data.modules.levels.reset_on_leave } })
            }

            if (data.modules.levels.allowed) {
                if (Array.isArray(data.modules.levels.allowed.channels)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.allowed.channels': data.modules.levels.allowed.channels } })
                }

                if (Array.isArray(data.modules.levels.allowed.roles)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.allowed.roles': data.modules.levels.allowed.roles } })
                }
            }

            if (data.modules.levels.blocked) {
                if (Array.isArray(data.modules.levels.blocked.channels)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.blocked.channels': data.modules.levels.blocked.channels } })
                }

                if (Array.isArray(data.modules.levels.blocked.roles)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.blocked.roles': data.modules.levels.blocked.roles } })
                }
            }

            if (data.modules.levels.level_up_alerts) {
                if (typeof data.modules.levels.level_up_alerts.active === 'boolean' && data.modules.levels.level_up_alerts.active !== guild.modules.levels.level_up_alerts.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.active': data.modules.levels.level_up_alerts.active } })
                }

                if (typeof data.modules.levels.level_up_alerts.format === 'string' && data.modules.levels.level_up_alerts.format !== guild.modules.levels.level_up_alerts.format) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.format': data.modules.levels.level_up_alerts.format } })
                }

                if (typeof data.modules.levels.level_up_alerts.channel_id === 'string' && data.modules.levels.level_up_alerts.channel_id !== guild.modules.levels.level_up_alerts.channel_id) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.channel_id': data.modules.levels.level_up_alerts.channel_id } })
                }

                if (data.modules.levels.level_up_alerts.message) {
                    if (typeof data.modules.levels.level_up_alerts.message.content === 'string' && data.modules.levels.level_up_alerts.message.content !== guild.modules.levels.level_up_alerts.message.content) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.message.content': data.modules.levels.level_up_alerts.message.content } })
                    }

                    if (data.modules.levels.level_up_alerts.message.embed) {
                        const newEmbed = data.modules.levels.level_up_alerts.message.embed
                        const oldEmbed = guild.modules.levels.level_up_alerts.message.embed
    
                        await Servers.updateOne({ _id: guild._id }, {
                            $set: {
                                'modules.levels.level_up_alerts.message.embed': {
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
                        })
                    }
                }

                if (Array.isArray(data.modules.levels.awards)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.awards': data.modules.levels.awards.slice(0, (guild.server.premium.available ? 200 : 20)) } })
                }
            }
        }

        if (data.modules.restoring) {
            if (typeof data.modules.restoring.restore_nicknames === 'boolean' && data.modules.restoring.restore_nicknames !== guild.modules.restoring.restore_nicknames) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.restoring.restore_nicknames': data.modules.restoring.restore_nicknames } })
            }

            if (typeof data.modules.restoring.restore_roles === 'boolean' && data.modules.restoring.restore_roles !== guild.modules.restoring.restore_roles) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.restoring.restore_roles': data.modules.restoring.restore_roles } })
            }

            if (Array.isArray(data.modules.restoring.strict_roles)) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.restoring.strict_roles': data.modules.restoring.strict_roles } })
            }
        }

        if (data.modules.music) {
            if (Array.isArray(data.modules.music.allowed.channels)) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.music.allowed.channels': data.modules.music.allowed.channels } })
            }

            if (Array.isArray(data.modules.music.blocked.channels)) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.music.blocked.channels': data.modules.music.blocked.channels } })
            }

            if (typeof data.modules.music.allow_radio_playback === 'boolean' && data.modules.music.allow_radio_playback !== guild.modules.music.allow_radio_playback && guild.server.premium.available) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.music.allow_radio_playback': data.modules.music.allow_radio_playback } })
            }

            if (typeof data.modules.music.queue_max_length === 'number' && data.modules.music.queue_max_length !== guild.modules.music.queue_max_length && guild.server.premium.available) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.music.queue_max_length': data.modules.music.queue_max_length } })
            }

            if (typeof data.modules.music.default_volume === 'number' && data.modules.music.default_volume !== guild.modules.music.default_volume && guild.server.premium.available) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.music.default_volume': data.modules.music.default_volume } })
            }
        }

        if (data.modules.voice_manager) {
            if (Array.isArray(data.modules.voice_manager.voice_roles)) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.voice_manager.voice_roles': data.modules.voice_manager.voice_roles.slice(0, (guild.server.premium.available ? 20 : 2)) } })
            }
        }

        if (data.modules.reports) {
            if (typeof data.modules.reports.active === 'boolean' && data.modules.reports.active !== guild.modules.reports.active) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.reports.active': data.modules.reports.active } })
            }

            if (typeof data.modules.reports.channel_id === 'string' && data.modules.reports.channel_id !== guild.modules.reports.channel_id) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.reports.channel_id': data.modules.reports.channel_id } })
            }
        }

        if (data.modules.autoreactions) {
            if (data.modules.autoreactions.length) {
                for (const reaction of data.modules.autoreactions.slice(0, (guild.server.premium.available ? 20 : 2))) {
                    reaction.reactions.filter(emoji => !emoji.name).forEach(emoji => {
                        const index = reaction.reactions.indexOf(emoji)
                        reaction.reactions[index] = Util.parseEmoji(emoji as any)
                    })
                }

                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.autoreactions': data.modules.autoreactions } })
            }

            else await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.autoreactions': [] } })
        }

        if (data.modules.economy) {
            if (typeof data.modules.economy.active == 'boolean' && data.modules.economy.active !== guild.modules.economy.active) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.economy.active': data.modules.economy.active } })
            }

            if (Array.isArray(data.modules.economy.currencies) && data.modules.economy.currencies.length && JSON.stringify(data.modules.economy.currencies) !== JSON.stringify(guild.modules.economy.currencies)) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.economy.currencies': data.modules.economy.currencies.slice(0, 2) } })
            }

            if (Array.isArray(data.modules.economy.store?.items) && JSON.stringify(data.modules.economy.store.items) !== JSON.stringify(guild.modules.economy.store.items)) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.economy.store.items': data.modules.economy.store.items.slice(0, (guild.server.premium.available ? 200 : 20)) } })
            }
        }
    }

    const changes = [ ...new Set(Object.keys(dotNotateObject(data)).map(k => k.split('.').slice(0, 3).join('.'))) ]

    await Servers.updateOne({ _id: guild._id }, {
        $push: {
            change_log: {
                $each: [ { user_id, changes, timestamp: Date.now() } ],
                $sort: { timestamp: 1 },
                $slice: -50
            } as never
        }
    })

    return await Servers.findOne({ _id: guild._id })
}

export async function addReactionElement(server: ServerDocument, reaction: Partial<ReactionElement>) {
    const element_id = generateId(), emoji = Util.parseEmoji(reaction.emoji as any)
    const elements = server.modules.reactions

    if (elements.length >= 20 && !server.server.premium.available) return 'reactions_limit_reached_no_premium'

    if (elements.length >= 200) return 'reactions_limit_reached'
    
    if (elements.some(r => r.message.id == reaction.message.id && r.emoji.name == emoji.name)) return 'emoji_already_used'

    if (elements.some(r => r.message.id == reaction.message.id && (r.element.single || r.element.global_single) && r.references.some(ref => reaction.references.includes(ref)))) return 'reference_is_single'

    const message = await rest.get(Routes.channelMessage(reaction.message.channel_id, reaction.message.id)).catch(() => {})

    if (!message) return 'unknown_message'

    const __reaction = await rest.put(Routes.channelMessageOwnReaction(reaction.message.channel_id, reaction.message.id, encodeURIComponent(emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name))).catch(() => {})

    if (!__reaction) return 'cannot_create_reaction'

    await Servers.updateOne({ _id: server._id }, {
        $push: {
            'modules.reactions': {
                id: element_id,
                type: reaction.type,
                element: {
                    single: reaction.element.single,
                    global_single: false,
                    reverse: reaction.element.reverse,
                    lifespan: 0
                },
                message: {
                    id: reaction.message.id,
                    channel_id: reaction.message.channel_id
                },
                emoji: emoji,
                references: reaction.references
            }
        }
    })

    const updated = await Servers.findOne({ _id: server._id })
    return updated.modules.reactions.find(r => r.id == element_id)
}

export async function editReactionElement(server: ServerDocument, reaction: ReactionElement) {
    const element = server.modules.reactions.find(r => r.id == reaction.id)

    if (!element) return 'element_not_found'

    if (server.modules.reactions.some(r => r.id != reaction.id && r.message.id == reaction.message.id && (r.element.single || r.element.global_single) && r.references.some(ref => reaction.references.includes(ref)))) return 'reference_is_single'

    await Servers.updateOne({ _id: server._id, 'modules.reactions.id': element.id }, {
        $set: {
            'modules.reactions.$.element.single': reaction.element.single,
            'modules.reactions.$.element.reverse': reaction.element.reverse,
            'modules.reactions.$.references': reaction.references
        }
    })

    return reaction
}

export async function removeReactionElement(server: ServerDocument, reaction_id: string) {
    const element = server.modules.reactions.find(r => r.id == reaction_id)

    if (!element) return 'element_not_found'

    await Servers.updateOne({ _id: server._id }, {
        $pull: {
            'modules.reactions': {
                id: reaction_id
            }
        }
    })

    await rest.delete(Routes.channelMessageReaction(element.message.channel_id, element.message.id, encodeURIComponent(element.emoji.id ? `${element.emoji.name}:${element.emoji.id}` : element.emoji.name))).catch(() => {})

    return true
}

export async function createTwitchSubscription(server: ServerDocument, subscription: any) {
    const subscriptions = server.modules.subscriptions.twitch

    if (subscriptions.length >= 1 && !server.server.premium.available) return 'twitch_channels_limit_reached_no_premium'

    if (subscriptions.length >= 10) return 'twitch_channels_limit_reached'

    if (subscriptions.some(s => s.broadcaster_id == subscription.broadcaster.id)) return 'twitch_channel_already_added'

    const twitchSub = await db.twitchSubs.findOne({ broadcaster_id: subscription.broadcaster.id })

    if (!twitchSub) {
        const eventSubResponse = await eventSubSubscribe('stream.online', subscription.broadcaster.id)
        let eventSub: ITwitchIncomingWebhook['subscription']

        if (eventSubResponse.ok) {
            const { data } = await eventSubResponse.json()

            eventSub = data[0]
        }

        if (!eventSub) return 'twitch_subscribe_error'

        await db.twitchSubs.create({
            _id: eventSub.id,
            broadcaster_id: subscription.broadcaster.id,
            broadcaster_login: subscription.broadcaster.login,
            broadcaster_name: subscription.broadcaster.name,
            broadcaster_thumbnail_url: subscription.broadcaster.thumbnail
        } as any)
    }

    const webhook = await rest.post(Routes.channelWebhooks(subscription.notification_channel_id), {
        body: {
            name: subscription.broadcaster.name,
            avatar: await DataResolver.resolveImage(subscription.broadcaster.thumbnail)
        }
    })
    .catch(() => {}) as any

    const data = {
        broadcaster_id: subscription.broadcaster.id,
        broadcaster_name: subscription.broadcaster.name,
        broadcaster_thumbnail_url: subscription.broadcaster.thumbnail,
        notification_channel_id: subscription.notification_channel_id,
        notification_message: subscription.notification_message,
        webhook_id: webhook?.id ?? null,
        webhook_token: webhook?.token ?? null,
        display_stream_preview: subscription.display_stream_preview
    }

    await db.servers.updateOne({ _id: server._id }, {
        $push: {
            'modules.subscriptions.twitch': data
        }
    })

    return data
}

export async function updateTwitchSubscription(server: ServerDocument, subscription: any) {
    const subscriptions = server.modules.subscriptions.twitch

    if (!subscriptions.some(s => s.broadcaster_id == subscription.broadcaster_id)) return 'twitch_channel_not_found'

    await db.servers.updateOne({ _id: server._id, 'modules.subscriptions.twitch.broadcaster_id': subscription.broadcaster_id }, {
        $set: {
            'modules.subscriptions.twitch.$.notification_channel_id': subscription.notification_channel_id,
            'modules.subscriptions.twitch.$.notification_message': subscription.notification_message,
            'modules.subscriptions.twitch.$.display_stream_preview': subscription.display_stream_preview
        }
    })
}

export async function deleteTwitchSubscription(server: ServerDocument, subscription: any) {
    const subscriptions = server.modules.subscriptions.twitch
    const sub = subscriptions.find(s => s.broadcaster_id == subscription.broadcaster_id)

    if (!sub) return 'twitch_channel_not_found'

    await Servers.updateOne({ _id: server._id }, {
        $pull: {
            'modules.subscriptions.twitch': {
                broadcaster_id: sub.broadcaster_id
            }
        }
    })

    const subscribedGuilds = await db.servers.find({ 'modules.subscriptions.twitch.broadcaster_id': sub.broadcaster_id })

    if (!subscribedGuilds.length) {
        const twitchSub = await db.twitchSubs.findOne({ broadcaster_id: sub.broadcaster_id })

        await eventSubUnsubscribe(twitchSub?._id).catch(() => {})
        await db.twitchSubs.deleteMany({ broadcaster_id: sub.broadcaster_id })
    }
    
    if (sub.webhook_id) await rest.delete(Routes.webhook(sub.webhook_id, sub.webhook_token)).catch(() => {})
}

export async function createYouTubeSubscription(server: ServerDocument, subscription: any) {
    const subscriptions = server.modules.subscriptions.youtube

    if (subscriptions.length >= 1 && !server.server.premium.available) return 'youtube_channels_limit_reached_no_premium'

    if (subscriptions.length >= 10) return 'youtube_channels_limit_reached'

    if (subscriptions.some(s => s.channel_id == subscription.channel.id)) return 'youtube_channel_already_added'

    const youtubeSub = await db.youtubeSubs.findOne({ _id: subscription.channel.id })

    if (!youtubeSub) {
        const hubSubscribeResponse = await hubSubscribe(subscription.channel.id)

        if (hubSubscribeResponse.ok) {
            await db.youtubeSubs.create({
                _id: subscription.channel.id,
                channel_name: subscription.channel.name,
                channel_thumbnail_url: subscription.channel.thumbnail,
            } as any)
        }

        else return 'youtube_subscribe_error'
    }

    const webhook = await rest.post(Routes.channelWebhooks(subscription.notification_channel_id), {
        body: {
            name: subscription.channel.name,
            avatar: await DataResolver.resolveImage(subscription.channel.thumbnail)
        }
    })
    .catch(() => {}) as any

    const data = {
        channel_id: subscription.channel.id,
        channel_name: subscription.channel.name,
        channel_thumbnail_url: subscription.channel.thumbnail,
        notification_channel_id: subscription.notification_channel_id,
        notification_message: subscription.notification_message,
        webhook_id: webhook?.id ?? null,
        webhook_token: webhook?.token ?? null
    }

    await db.servers.updateOne({ _id: server._id }, {
        $push: {
            'modules.subscriptions.youtube': data
        }
    })

    return data
}

export async function updateYouTubeSubscription(server: ServerDocument, subscription: any) {
    const subscriptions = server.modules.subscriptions.youtube

    if (!subscriptions.some(s => s.channel_id == subscription.channel_id)) return 'youtube_channel_not_found'

    await db.servers.updateOne({ _id: server._id, 'modules.subscriptions.youtube.channel_id': subscription.channel_id }, {
        $set: {
            'modules.subscriptions.youtube.$.notification_channel_id': subscription.notification_channel_id,
            'modules.subscriptions.youtube.$.notification_message': subscription.notification_message
        }
    })
}

export async function deleteYouTubeSubscription(server: ServerDocument, subscription: any) {
    const subscriptions = server.modules.subscriptions.youtube
    const sub = subscriptions.find(s => s.channel_id == subscription.channel_id)

    if (!sub) return 'youtube_channel_not_found'

    await db.servers.updateOne({ _id: server._id }, {
        $pull: {
            'modules.subscriptions.youtube': {
                channel_id: sub.channel_id
            }
        }
    })

    const subscribedGuilds = await db.servers.find({ 'modules.subscriptions.youtube.channel_id': sub.channel_id })

    if (!subscribedGuilds.length) {
        await hubSubscribe(sub.channel_id, 'unsubscribe').catch(() => {})
        await db.youtubeSubs.deleteOne({ _id: sub.channel_id })
    }
    
    if (sub.webhook_id) await rest.delete(Routes.webhook(sub.webhook_id, sub.webhook_token)).catch(() => {})

    return true
}

export async function addVoiceTrigger(server: ServerDocument, trigger: VoiceChannelTrigger) {
    const triggers = server.modules.voice_manager.temp_voice_channels.triggers

    if (triggers.length >= 2 && !server.server.premium.available) return 'voice_triggers_limit_reached_no_premium'

    if (triggers.length >= 20) return 'voice_triggers_limit_reached'

    if (triggers.some(t => t.channel_id == trigger.channel_id)) return 'voice_trigger_already_added'

    await Servers.updateOne({ _id: server._id }, {
        $push: {
            'modules.voice_manager.temp_voice_channels.triggers': trigger
        }
    })

    return trigger
}

export async function editVoiceTrigger(server: ServerDocument, trigger: Partial<VoiceChannelTrigger>) {
    const triggers = server.modules.voice_manager.temp_voice_channels.triggers

    if (!triggers.some(t => t.channel_id == trigger.channel_id)) return 'voice_trigger_not_found'

    await Servers.updateOne({ _id: server._id, 'modules.voice_manager.temp_voice_channels.triggers.channel_id': trigger.channel_id }, {
        $set: {
            'modules.voice_manager.temp_voice_channels.triggers.$.default': trigger.default,
            'modules.voice_manager.temp_voice_channels.triggers.$.allowed_roles': trigger.allowed_roles ?? [],
            'modules.voice_manager.temp_voice_channels.triggers.$.blocked_roles': trigger.blocked_roles ?? [],
            'modules.voice_manager.temp_voice_channels.triggers.$.moderator_roles': trigger.moderator_roles ?? []
        }
    })

    return trigger
}

export async function removeVoiceTrigger(server: ServerDocument, channel_id: string) {
    const triggers = server.modules.voice_manager.temp_voice_channels.triggers
    const trigger = triggers.find(t => t.channel_id == channel_id)

    if (!trigger) return 'voice_trigger_not_found'

    await Servers.updateOne({ _id: server._id }, {
        $pull: {
            'modules.voice_manager.temp_voice_channels.triggers': {
                channel_id: channel_id
            }
        }
    })

    return true
}

export default {
    updateSettings,
    addReactionElement,
    editReactionElement,
    removeReactionElement,
    createTwitchSubscription,
    updateTwitchSubscription,
    deleteTwitchSubscription,
    addVoiceTrigger,
    editVoiceTrigger,
    removeVoiceTrigger,
    createYouTubeSubscription,
    updateYouTubeSubscription,
    deleteYouTubeSubscription
}