const Servers = require('../../../database/schemas/Servers')
const { GenerateUID } = require('../../../modules/Reactions')
const { Util, MessageEmbed } = require('discord.js')
const Channels = require('../discord/rest/Channels')
const Webhooks = require('../discord/rest/Webhooks')

class Guilds {
    static async isBotExpert(guild_id, id) {
        const server = await Servers.findOne({ _id: guild_id })
        return server ? server.server.bot_experts.some(expert => expert.id === id && expert.expires_timestamp > Date.now()) : false
    }

    /**
     * @param {import('../../Typings').ServerDocument} guild
     * @param {Partial<import('../../Typings').ServerDocument>} data
     * @param {string} user_id 
     * @returns {import('../../Typings').ServerDocument}
     */
    static async updateSettings(guild, data, user_id) {
        if (typeof data.prefix === 'string' && data.prefix !== guild.prefix) {
            if (data.prefix.length && data.prefix.length <= 3) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'prefix': data.prefix } })
            }
        }

        if (typeof data.locale === 'string' && data.locale !== guild.locale) {
            const locales = ['ru', 'en']
            if (locales.includes(data.locale)) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'locale': data.locale } })
            }
        }

        if (data.commands) {
            if (Array.isArray(data.commands.system) && data.commands.system.length) {
                await Servers.updateOne({ _id: guild._id }, { $set: { 'commands.system': data.commands.system } })
            }

            if (Array.isArray(data.commands.custom)) {
                data.commands.custom = data.commands.custom.slice(0, 249)
                data.commands.custom = [ ...new Map(data.commands.custom.map(c => [c.name.toLowerCase(), c])).values() ]
                
                await Servers.updateOne({ _id: guild._id }, { $set: { 'commands.custom': data.commands.custom } })
            }
        }

        if (data.moderation) {
            if (data.moderation.case_log) {
                if ((typeof data.moderation.case_log.channel_id === 'string' || data.moderation.case_log.channel_id === null) && data.moderation.case_log.channel_id !== guild.moderation.case_log.channel_id) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.case_log.channel_id': data.moderation.case_log.channel_id || '' } })
                }

                if (typeof data.moderation.case_log.case_types === 'object') {
                    const data_case_types = Object.values(data.moderation.case_log.case_types)
                    const guild_case_types = Object.values(guild.moderation.case_log.case_types)

                    if (data_case_types.some((v, i) => v !== guild_case_types[i])) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.case_log.case_types': data.moderation.case_log.case_types } })
                    }
                }
            }

            if (data.moderation.logs) {
                if (typeof data.moderation.logs.types === 'object') {
                    const data_logs = Object.keys(data.moderation.logs.types)

                    for (const log of data_logs) {
                        if (data.moderation.logs.types[log].active !== guild.moderation.logs.types[log].active || data.moderation.logs.types[log].channel_id !== guild.moderation.logs.types[log].channel_id) {
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
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.warnings.penalties': data.moderation.warnings.penalties } })
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
                                if (data.moderation.automoder.links_filter.penalty.message.embed.fields.length)
                                    data.moderation.automoder.links_filter.penalty.message.embed.fields = data.moderation.automoder.links_filter.penalty.message.embed.fields.filter(field => field.name && field.value && typeof field.inline === 'boolean')

                                const embed = new MessageEmbed(data.moderation.automoder.links_filter.penalty.message.embed)
                                await Servers.updateOne({ _id: guild._id }, {
                                    $set: {
                                        'moderation.automoder.links_filter.penalty.message.embed': {
                                            active: data.moderation.automoder.links_filter.penalty.message.embed.active,
                                            title: embed.title,
                                            description: embed.description,
                                            url: embed.url,
                                            timestamp: data.moderation.automoder.links_filter.penalty.message.embed.timestamp,
                                            color: data.moderation.automoder.links_filter.penalty.message.embed.color,
                                            footer: {
                                                text: embed.footer.text,
                                                icon_url: embed.footer.iconURL
                                            },
                                            image: {
                                                url: embed.image.url
                                            },
                                            thumbnail: {
                                                url: embed.thumbnail.url
                                            },
                                            author: {
                                                name: embed.author.name,
                                                url: embed.author.url,
                                                icon_url: embed.author.iconURL
                                            },
                                            fields: embed.fields
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
                                if (data.moderation.automoder.swear_filter.penalty.message.embed.fields.length)
                                    data.moderation.automoder.swear_filter.penalty.message.embed.fields = data.moderation.automoder.swear_filter.penalty.message.embed.fields.filter(field => field.name && field.value && typeof field.inline === 'boolean')

                                const embed = new MessageEmbed(data.moderation.automoder.swear_filter.penalty.message.embed)
                                await Servers.updateOne({ _id: guild._id }, {
                                    $set: {
                                        'moderation.automoder.swear_filter.penalty.message.embed': {
                                            active: data.moderation.automoder.swear_filter.penalty.message.embed.active,
                                            title: embed.title,
                                            description: embed.description,
                                            url: embed.url,
                                            timestamp: data.moderation.automoder.swear_filter.penalty.message.embed.timestamp,
                                            color: data.moderation.automoder.swear_filter.penalty.message.embed.color,
                                            footer: {
                                                text: embed.footer.text,
                                                icon_url: embed.footer.iconURL
                                            },
                                            image: {
                                                url: embed.image.url
                                            },
                                            thumbnail: {
                                                url: embed.thumbnail.url
                                            },
                                            author: {
                                                name: embed.author.name,
                                                url: embed.author.url,
                                                icon_url: embed.author.iconURL
                                            },
                                            fields: embed.fields
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
                                if (data.moderation.automoder.users_slowdown.penalty.message.embed.fields.length)
                                    data.moderation.automoder.users_slowdown.penalty.message.embed.fields = data.moderation.automoder.users_slowdown.penalty.message.embed.fields.filter(field => field.name && field.value && typeof field.inline === 'boolean')

                                const embed = new MessageEmbed(data.moderation.automoder.users_slowdown.penalty.message.embed)
                                await Servers.updateOne({ _id: guild._id }, {
                                    $set: {
                                        'moderation.automoder.users_slowdown.penalty.message.embed': {
                                            active: data.moderation.automoder.users_slowdown.penalty.message.embed.active,
                                            title: embed.title,
                                            description: embed.description,
                                            url: embed.url,
                                            timestamp: data.moderation.automoder.users_slowdown.penalty.message.embed.timestamp,
                                            color: data.moderation.automoder.users_slowdown.penalty.message.embed.color,
                                            footer: {
                                                text: embed.footer.text,
                                                icon_url: embed.footer.iconURL
                                            },
                                            image: {
                                                url: embed.image.url
                                            },
                                            thumbnail: {
                                                url: embed.thumbnail.url
                                            },
                                            author: {
                                                name: embed.author.name,
                                                url: embed.author.url,
                                                icon_url: embed.author.iconURL
                                            },
                                            fields: embed.fields
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
                                if (data.moderation.automoder.anti_caps.penalty.message.embed.fields.length)
                                    data.moderation.automoder.anti_caps.penalty.message.embed.fields = data.moderation.automoder.anti_caps.penalty.message.embed.fields.filter(field => field.name && field.value && typeof field.inline === 'boolean')

                                const embed = new MessageEmbed(data.moderation.automoder.anti_caps.penalty.message.embed)
                                await Servers.updateOne({ _id: guild._id }, {
                                    $set: {
                                        'moderation.automoder.anti_caps.penalty.message.embed': {
                                            active: data.moderation.automoder.anti_caps.penalty.message.embed.active,
                                            title: embed.title,
                                            description: embed.description,
                                            url: embed.url,
                                            timestamp: data.moderation.automoder.anti_caps.penalty.message.embed.timestamp,
                                            color: data.moderation.automoder.anti_caps.penalty.message.embed.color,
                                            footer: {
                                                text: embed.footer.text,
                                                icon_url: embed.footer.iconURL
                                            },
                                            image: {
                                                url: embed.image.url
                                            },
                                            thumbnail: {
                                                url: embed.thumbnail.url
                                            },
                                            author: {
                                                name: embed.author.name,
                                                url: embed.author.url,
                                                icon_url: embed.author.iconURL
                                            },
                                            fields: embed.fields
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

                        if (typeof data.moderation.automoder.nicknames.types.links === 'boolean' && data.moderation.automoder.nicknames.types.links !== guild.moderation.automoder.nicknames.types.links) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.types.links': data.moderation.automoder.nicknames.types.links } })
                        }

                        if (typeof data.moderation.automoder.nicknames.types.regexp.pattern === 'string' && data.moderation.automoder.nicknames.types.regexp.pattern !== guild.moderation.automoder.nicknames.types.regexp.pattern) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.types.regexp.pattern': data.moderation.automoder.nicknames.types.regexp.pattern } })
                        }

                        if (Array.isArray(data.moderation.automoder.nicknames.types.regexp.flags)) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'moderation.automoder.nicknames.types.regexp.flags': data.moderation.automoder.nicknames.types.regexp.flags } })
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
                    }
                }
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
                        if (data.modules.welcome.message.embed.fields.length)
                            data.modules.welcome.message.embed.fields = data.modules.welcome.message.embed.fields.filter(field => field.name && field.value && typeof field.inline === 'boolean')

                        const embed = new MessageEmbed(data.modules.welcome.message.embed)
                        await Servers.updateOne({ _id: guild._id }, {
                            $set: {
                                'modules.welcome.message.embed': {
                                    active: data.modules.welcome.message.embed.active,
                                    title: embed.title,
                                    description: embed.description,
                                    url: embed.url,
                                    timestamp: data.modules.welcome.message.embed.timestamp,
                                    color: data.modules.welcome.message.embed.color,
                                    footer: {
                                        text: embed.footer.text,
                                        icon_url: embed.footer.iconURL
                                    },
                                    image: {
                                        url: embed.image.url
                                    },
                                    thumbnail: {
                                        url: embed.thumbnail.url
                                    },
                                    author: {
                                        name: embed.author.name,
                                        url: embed.author.url,
                                        icon_url: embed.author.iconURL
                                    },
                                    fields: embed.fields
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
                        if (data.modules.farewell.message.embed.fields.length)
                            data.modules.farewell.message.embed.fields = data.modules.farewell.message.embed.fields.filter(field => field.name && field.value && typeof field.inline === 'boolean')

                        const embed = new MessageEmbed(data.modules.farewell.message.embed)
                        await Servers.updateOne({ _id: guild._id }, {
                            $set: {
                                'modules.farewell.message.embed': {
                                    active: data.modules.farewell.message.embed.active,
                                    title: embed.title,
                                    description: embed.description,
                                    url: embed.url,
                                    timestamp: data.modules.farewell.message.embed.timestamp,
                                    color: data.modules.farewell.message.embed.color,
                                    footer: {
                                        text: embed.footer.text,
                                        icon_url: embed.footer.iconURL
                                    },
                                    image: {
                                        url: embed.image.url
                                    },
                                    thumbnail: {
                                        url: embed.thumbnail.url
                                    },
                                    author: {
                                        name: embed.author.name,
                                        url: embed.author.url,
                                        icon_url: embed.author.iconURL
                                    },
                                    fields: embed.fields
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

                        if (typeof data.modules.levels.level_up_alerts.channel_id === 'string' && data.modules.levels.level_up_alerts.channel_id !== guild.modules.levels.level_up_alerts.channel_id) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.channel_id': data.modules.levels.level_up_alerts.channel_id } })
                        }
                    }

                    if (data.modules.levels.level_up_alerts.message) {
                        if (typeof data.modules.levels.level_up_alerts.message.content === 'string' && data.modules.levels.level_up_alerts.message.content !== guild.modules.levels.level_up_alerts.message.content) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.message.content': data.modules.levels.level_up_alerts.message.content } })
                        }

                        if (data.modules.levels.level_up_alerts.message.embed) {
                            if (data.modules.levels.level_up_alerts.message.embed.fields.length)
                                data.modules.levels.level_up_alerts.message.embed.fields = data.modules.levels.level_up_alerts.message.embed.fields.filter(field => field.name && field.value && typeof field.inline === 'boolean')

                            const embed = new MessageEmbed(data.modules.levels.level_up_alerts.message.embed)
                            await Servers.updateOne({ _id: guild._id }, {
                                $set: {
                                    'modules.levels.level_up_alerts.message.embed': {
                                        active: data.modules.levels.level_up_alerts.message.embed.active,
                                        title: embed.title,
                                        description: embed.description,
                                        url: embed.url,
                                        timestamp: data.modules.levels.level_up_alerts.message.embed.timestamp,
                                        color: data.modules.levels.level_up_alerts.message.embed.color,
                                        footer: {
                                            text: embed.footer.text,
                                            icon_url: embed.footer.iconURL
                                        },
                                        image: {
                                            url: embed.image.url
                                        },
                                        thumbnail: {
                                            url: embed.thumbnail.url
                                        },
                                        author: {
                                            name: embed.author.name,
                                            url: embed.author.url,
                                            icon_url: embed.author.iconURL
                                        },
                                        fields: embed.fields
                                    }
                                }
                            })
                        }
                    }

                    if (Array.isArray(data.modules.levels.awards)) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.awards': data.modules.levels.awards } })
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
                    if (data.modules.voice_manager.voice_roles.length <= 100) {
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.voice_manager.voice_roles': data.modules.voice_manager.voice_roles } })
                    }
                }
            }

            if (data.modules.reports) {
                if (typeof data.modules.reports.active === 'boolean' && data.modules.reports.active !== guild.modules.reports.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.reports.active': data.modules.reports.active } })
                }

                if (typeof data.modules.reports.channel_id === 'string' && data.modules.reports.channel_id !== guild.modules.reports.channel_id) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.reports.channel_id': data.modules.reports.channel_id } })
                }

                if (typeof data.modules.reports.emoji === 'object' && data.modules.reports.emoji.name !== guild.modules.reports.emoji.name) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.reports.emoji': data.modules.reports.emoji } })
                }

                if (data.modules.reports.minimum && typeof data.modules.reports.minimum === 'number' && data.modules.reports.minimum !== guild.modules.reports.minimum) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.reports.minimum': data.modules.reports.minimum } })
                }
            }

            if (data.modules.autoreactions) {
                if (data.modules.autoreactions.length && data.modules.autoreactions.length <= 30) {
                    for (const reaction of data.modules.autoreactions) {
                        reaction.reactions.filter(emoji => !emoji.name).forEach(emoji => {
                            const index = reaction.reactions.indexOf(emoji)
                            reaction.reactions[index] = Util.parseEmoji(emoji)
                        })
                    }

                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.autoreactions': data.modules.autoreactions } })
                }

                else await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.autoreactions': [] } })
            }
        }

        return await Servers.findOne({ _id: guild._id }).lean()
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {Partial<import('../../Typings').ReactionElement>} reaction
     */
    static async addReactionElement(server, reaction) {
        const element_id = GenerateUID(), emoji = Util.parseEmoji(reaction.emoji)
        const elements = server.modules.reactions

        if (elements.length >= 100 && !server.server.premium.available) return 'reactions_limit_reached_no_premium'

        if (elements.length >= 250) return 'reactions_limit_reached'
        
        if (elements.some(r => r.message.id == reaction.message.id && r.emoji.name == emoji.name)) return 'emoji_already_used'

        if (elements.some(r => r.message.id == reaction.message.id && (r.element.single || r.element.global_single) && r.references.some(ref => reaction.references.includes(ref)))) return 'reference_is_single'

        const message = await Channels.getMessage(reaction.message.channel_id, reaction.message.id)

        if (!message) return 'unknown_message'

        const __reaction = await Channels.createReaction(reaction.message.channel_id, reaction.message.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name)

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

        const updated = await Servers.findOne({ _id: server._id }).lean()
        return updated.modules.reactions.find(r => r.id == element_id)
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {import('../../Typings').ReactionElement} reaction
     */
     static async editReactionElement(server, reaction) {
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

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {string} reaction_id
     */
    static async removeReactionElement(server, reaction_id) {
        const element = server.modules.reactions.find(r => r.id == reaction_id)

        if (!element) return 'element_not_found'

        await Servers.updateOne({ _id: server._id }, {
            $pull: {
                'modules.reactions': {
                    id: reaction_id
                }
            }
        })

        await Channels.deleteReactionEmoji(element.message.channel_id, element.message.id, element.emoji.id ? `${element.emoji.name}:${element.emoji.id}` : element.emoji.name)

        return true
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {Partial<import('../../Typings').TwitchChannel>} channel
     */
    static async addTwitchChannel(server, channel) {
        const channels = server.modules.twitch.channels

        if (channels.length >= 2 && !server.server.premium.available) return 'twitch_channels_limit_reached_no_premium'

        if (channels.length >= 10) return 'twitch_channels_limit_reached'

        if (channels.some(c => c.channel.id == channel.channel.id)) return 'twitch_channel_already_added'

        await Servers.updateOne({ _id: server._id }, {
            $push: {
                'modules.twitch.channels': {
                    active: true,
                    live: false,
                    last_check_timestamp: 0,
                    channel: {
                        id: channel.channel.id,
                        display_name: channel.channel.display_name,
                        logo: channel.channel.logo
                    },
                    alerts: {
                        channel_id: channel.alerts.channel_id,
                        message_template: channel.alerts.message_template,
                        display_preview: channel.alerts.display_preview,
                        after_end: {
                            delete_alert: channel.alerts.after_end.delete_alert,
                            message_id: ''
                        },
                        webhook: {
                            id: '',
                            token: ''
                        }
                    }
                }
            }
        })

        const updated = await Servers.findOne({ _id: server._id }).lean()
        return updated.modules.twitch.channels.find(c => c.channel.id == channel.channel.id)
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {Partial<import('../../Typings').TwitchChannel>} channel
     */
    static async editTwitchChannel(server, channel) {
        const channels = server.modules.twitch.channels

        if (!channels.some(c => c.channel.id == channel.channel.id)) return 'twitch_channel_not_found'

        await Servers.updateOne({ _id: server._id, 'modules.twitch.channels.channel.id': channel.channel.id }, {
            $set: {
                'modules.twitch.channels.$.alerts.channel_id': channel.alerts.channel_id,
                'modules.twitch.channels.$.alerts.message_template': channel.alerts.message_template,
                'modules.twitch.channels.$.alerts.display_preview': channel.alerts.display_preview,
                'modules.twitch.channels.$.alerts.after_end.delete_alert': channel.alerts.after_end.delete_alert
            }
        })

        return channel
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {number} channel_id
     */
    static async removeTwitchChannel(server, channel_id) {
        channel_id = Number(channel_id)

        const channels = server.modules.twitch.channels
        const channel = channels.find(c => c.channel.id == channel_id)

        if (!channel) return 'twitch_channel_not_found'

        await Servers.updateOne({ _id: server._id }, {
            $pull: {
                'modules.twitch.channels': {
                    'channel.id': channel_id
                }
            }
        })
        
        if (channel.alerts.webhook.id) await Webhooks.deleteWebhook(channel.alerts.webhook.id)

        return true
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {Partial<import('../../Typings').YouTubeChannel>} channel
     */
     static async addYouTubeChannel(server, channel) {
        const channels = server.modules.youtube.channels

        if (channels.length >= 2 && !server.server.premium.available) return 'youtube_channels_limit_reached_no_premium'

        if (channels.length >= 10) return 'youtube_channels_limit_reached'

        if (channels.some(c => c.channel.id == channel.channel.id)) return 'youtube_channel_already_added'

        await Servers.updateOne({ _id: server._id }, {
            $push: {
                'modules.youtube.channels': {
                    active: true,
                    last_video_id: '',
                    last_check_timestamp: 0,
                    channel: {
                        id: channel.channel.id,
                        name: channel.channel.name,
                        thumbnail: channel.channel.thumbnail
                    },
                    alerts: {
                        channel_id: channel.alerts.channel_id,
                        videos_message_template: channel.alerts.videos_message_template,
                        broadcasts_message_template: channel.alerts.broadcasts_message_template,
                        videos: channel.alerts.videos,
                        broadcasts: channel.alerts.broadcasts,
                        webhook: {
                            id: '',
                            token: ''
                        }
                    }
                }
            }
        })

        const updated = await Servers.findOne({ _id: server._id }).lean()
        return updated.modules.youtube.channels.find(c => c.channel.id == channel.channel.id)
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {Partial<import('../../Typings').YouTubeChannel>} channel
     */
    static async editYouTubeChannel(server, channel) {
        const channels = server.modules.youtube.channels

        if (!channels.some(c => c.channel.id == channel.channel.id)) return 'youtube_channel_not_found'

        await Servers.updateOne({ _id: server._id, 'modules.youtube.channels.channel.id': channel.channel.id }, {
            $set: {
                'modules.youtube.channels.$.alerts.channel_id': channel.alerts.channel_id,
                'modules.youtube.channels.$.alerts.videos_message_template': channel.alerts.videos_message_template,
                'modules.youtube.channels.$.alerts.broadcasts_message_template': channel.alerts.broadcasts_message_template,
                'modules.youtube.channels.$.alerts.videos': channel.alerts.videos,
                'modules.youtube.channels.$.alerts.broadcasts': channel.alerts.broadcasts
            }
        })

        return channel
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {number} channel_id
     */
    static async removeYouTubeChannel(server, channel_id) {
        const channels = server.modules.youtube.channels
        const channel = channels.find(c => c.channel.id == channel_id)

        if (!channel) return 'youtube_channel_not_found'

        await Servers.updateOne({ _id: server._id }, {
            $pull: {
                'modules.youtube.channels': {
                    'channel.id': channel_id
                }
            }
        })

        if (channel.alerts.webhook.id) await Webhooks.deleteWebhook(channel.alerts.webhook.id)

        return true
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {import('../../Typings').VoiceChannelTrigger} trigger
     */
    static async addVoiceTrigger(server, trigger) {
        const triggers = server.modules.voice_manager.temp_voice_channels.triggers

        if (triggers.length >= 2 && !server.server.premium.available) return 'voice_triggers_limit_reached_no_premium'

        if (triggers.length >= 30) return 'voice_triggers_limit_reached'

        if (triggers.some(t => t.channel_id == trigger.channel_id)) return 'voice_trigger_already_added'

        await Servers.updateOne({ _id: server._id }, {
            $push: {
                'modules.voice_manager.temp_voice_channels.triggers': trigger
            }
        })

        return trigger
    }

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {Partial<import('../../Typings').VoiceChannelTrigger>} trigger
     */
    static async editVoiceTrigger(server, trigger) {
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

    /**
     * @param {import('../../Typings').ServerDocument} server
     * @param {string} channel_id
     */
    static async removeVoiceTrigger(server, channel_id) {
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
}

module.exports = Guilds