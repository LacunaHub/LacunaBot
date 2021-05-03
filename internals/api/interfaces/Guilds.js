const Servers = require('../../../database/schemas/Servers')
const { GenerateUID } = require('../../../modules/Reactions')
const { Util } = require('discord.js')
const Channels = require('../discord/rest/Channels')

class Guilds {
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
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.welcome.message': data.modules.welcome.message } })
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
                        await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.farewell.message': data.modules.farewell.message } })
                    }
                }
            }

            if (data.modules.levels) {
                if (typeof data.modules.levels.active === 'boolean' && data.modules.levels.active !== guild.modules.levels.active) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.active': data.modules.levels.active } })
                }

                if (typeof data.modules.levels.single_roles === 'boolean' && data.modules.levels.single_roles !== guild.modules.levels.single_roles) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.single_roles': data.modules.levels.single_roles } })
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

                    if (typeof data.modules.levels.level_up_alerts.format === 'number' && data.modules.levels.level_up_alerts.format !== guild.modules.levels.level_up_alerts.format) {
                        if ([0, 1, 2].includes(data.modules.levels.level_up_alerts.format)) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.format': data.modules.levels.level_up_alerts.format } })
                        }

                        if (typeof data.modules.levels.level_up_alerts.channel_id === 'string' && data.modules.levels.level_up_alerts.channel_id !== guild.modules.levels.level_up_alerts.channel_id) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.channel_id': data.modules.levels.level_up_alerts.channel_id } })
                        }
                    }

                    if (data.modules.levels.level_up_alerts.message) {
                        if (typeof data.modules.levels.level_up_alerts.message.content === 'string' && data.modules.levels.level_up_alerts.message.content !== guild.modules.levels.level_up_alerts.message.content) {
                            await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.levels.level_up_alerts.message': data.modules.levels.level_up_alerts.message } })
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
                if (Array.isArray(data.modules.voice_manager.temp_voice_channels.triggers)) {
                    if (data.modules.voice_manager.temp_voice_channels.triggers.length > 1 && !guild.server.premium.available) {}
                    else await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.voice_manager.temp_voice_channels.triggers': data.modules.voice_manager.temp_voice_channels.triggers } })
                }

                if (Array.isArray(data.modules.voice_manager.voice_roles)) {
                    await Servers.updateOne({ _id: guild._id }, { $set: { 'modules.voice_manager.voice_roles': data.modules.voice_manager.voice_roles } })
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

        if (elements.some(r => (r.element.single || r.element.global_single) && r.references.some(ref => reaction.references.includes(ref)))) return 'reference_is_single'

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

        if (server.modules.reactions.some(r => r.id != reaction.id && (r.element.single || r.element.global_single) && r.references.some(ref => reaction.references.includes(ref)))) return 'reference_is_single'

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
}

module.exports = Guilds