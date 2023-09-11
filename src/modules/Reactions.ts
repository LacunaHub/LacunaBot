import { BaseGuildTextChannel, Collection, Message, MessageReaction, User } from 'discord.js'
import { split } from 'unicode-default-word-boundary'
import { AutoReaction, ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'

export function generateId() {
    return `L${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

export function parseId(str: string) {
    if (typeof str != 'string') throw new TypeError('STR_IS_NOT_STRING')

    return str.match(/:[A-Z0-9]{9}/)?.toString() ?? null
}

export async function reactionAdd(self: Lacuna, server: ServerDocument, reaction: MessageReaction, user: User): Promise<boolean> {
    if (server.modules.reactions.length) {
        const t = self.i18n.t.bind(null, server.locale)

        const message = await reaction.message.fetch()
        const element = server.modules.reactions
            .slice(0, server.server.premium.available ? 200 : 50)
            .find(r => r.message.id == message.id && (r.emoji.id ? r.emoji.id == reaction.emoji.id : r.emoji.name == reaction.emoji.name))

        if (element) {
            const member = await message.guild.members.fetch(user.id)

            if (element.element.lifespan && Date.now() > element.element.lifespan) {
                await self.db.servers.updateOne(
                    { _id: message.guild.id },
                    {
                        $pull: {
                            'modules.reactions': {
                                id: element.id
                            }
                        }
                    }
                )

                if (message.deletable) await reaction.remove()
                message.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)

                return false
            }

            if (element.type == 'CHANNEL') {
                const channels = message.guild.channels.cache.filter(c => c.manageable && element.references.includes(c.id)) as Collection<
                    string,
                    BaseGuildTextChannel
                >

                if (channels.size) {
                    try {
                        for (const [, channel] of channels)
                            await channel.permissionOverwrites.create(
                                user.id,
                                { ViewChannel: element.element.reverse ? true : false },
                                { reason: t('audit_reasons.irs') }
                            )

                        self.emit('moduleExecution', {
                            module: 'InteractiveReactions',
                            category: 'ReactionAdd',
                            label: 'ViewChannel',
                            guild: { id: message.guild.id, name: message.guild.name },
                            target: { id: member.id, name: member.user.tag }
                        })
                    } catch (err) {
                        await self.logger.handleError({
                            module: 'InteractiveReactions',
                            action: 'CreatePermissionOverwrites',
                            error: err,
                            guild_id: message.guildId
                        })

                        if (message.deletable) {
                            await reaction.users.remove(user.id)
                        }

                        return false
                    }
                }
            }

            if (element.type == 'ROLE') {
                const roles = message.guild.roles.cache.filter(r => r.editable && element.references.includes(r.id))

                if (roles.size) {
                    if (element.element.reverse && roles.some(r => member.roles.cache.has(r.id))) {
                        try {
                            await member.roles.remove(roles, t('audit_reasons.irs'))

                            self.emit('moduleExecution', {
                                module: 'InteractiveReactions',
                                category: 'ReactionAdd',
                                label: 'RemoveRoles',
                                guild: { id: message.guild.id, name: message.guild.name },
                                target: { id: member.id, name: member.user.tag }
                            })
                        } catch (err) {
                            await self.logger.handleError({
                                module: 'InteractiveReactions',
                                action: 'RemoveRoles',
                                error: err,
                                guild_id: message.guildId
                            })

                            if (message.deletable) {
                                await reaction.users.remove(user.id)
                            }

                            return false
                        }

                        return true
                    }

                    if (element.element.single || element.element.global_single) {
                        const single_elements = server.modules.reactions.filter(
                            r => r.element.global_single || (r.element.single && r.message.id == message.id)
                        )
                        const has_single_element: boolean = single_elements.some(sr => sr.references.some(r => member.roles.cache.has(r)))

                        if (has_single_element) {
                            if (message.deletable) {
                                await reaction.users.remove(user.id)
                            }

                            return false
                        }

                        try {
                            await member.roles.add(roles, t('audit_reasons.irs'))
                        } catch (err) {
                            await self.logger.handleError({
                                module: 'InteractiveReactions',
                                action: 'AddSingleRoles',
                                error: err,
                                guild_id: message.guildId
                            })

                            if (message.deletable) {
                                await reaction.users.remove(user.id)
                            }

                            return false
                        }
                    } else {
                        try {
                            await member.roles.add(roles, t('audit_reasons.irs'))
                        } catch (err) {
                            await self.logger.handleError({
                                module: 'InteractiveReactions',
                                action: 'AddRoles',
                                error: err,
                                guild_id: message.guildId
                            })

                            if (message.deletable) {
                                await reaction.users.remove(user.id)
                            }

                            return false
                        }
                    }

                    self.emit('moduleExecution', {
                        module: 'InteractiveReactions',
                        category: 'ReactionAdd',
                        label: 'AddRoles',
                        guild: { id: message.guild.id, name: message.guild.name },
                        target: { id: member.id, name: member.user.tag }
                    })
                }
            }
        }
    }

    return false
}

export async function reactionRemove(self: Lacuna, server: ServerDocument, reaction: MessageReaction, user: User) {
    if (server.modules.reactions.length) {
        const t = self.i18n.t.bind(null, server.locale)

        const message = reaction.message
        const element = server.modules.reactions
            .slice(0, server.server.premium.available ? 200 : 50)
            .find(r => r.message.id == message.id && (r.emoji.id ? r.emoji.id == reaction.emoji.id : r.emoji.name == reaction.emoji.name))

        if (element) {
            const member = await message.guild.members.fetch(user.id)

            if (element.type == 'CHANNEL') {
                const channels = message.guild.channels.cache.filter(c => c.manageable && element.references.includes(c.id)) as Collection<
                    string,
                    BaseGuildTextChannel
                >

                if (channels.size) {
                    try {
                        for (const [, channel] of channels) {
                            const overwrites = channel.permissionOverwrites.cache.find(p => p.id == user.id)

                            if (overwrites) {
                                await overwrites.delete(t('audit_reasons.irs'))

                                self.emit('moduleExecution', {
                                    module: 'InteractiveReactions',
                                    category: 'ReactionRemove',
                                    label: 'DeleteChannelOverwrites',
                                    guild: { id: message.guild.id, name: message.guild.name },
                                    target: { id: member.id, name: member.user.tag }
                                })
                            }
                        }
                    } catch (err) {
                        await self.logger.handleError({
                            module: 'InteractiveReactions',
                            action: 'DeletePermissionOverwrites',
                            error: err,
                            guild_id: message.guildId
                        })

                        return false
                    }
                }
            }

            if (element.type == 'ROLE') {
                const roles = message.guild.roles.cache.filter(r => r.editable && element.references.includes(r.id))

                if (roles.size) {
                    try {
                        if (element.element.reverse) await member.roles.add(roles, t('audit_reasons.irs'))
                        else await member.roles.remove(roles, t('audit_reasons.irs'))

                        self.emit('moduleExecution', {
                            module: `InteractiveReactions`,
                            category: 'ReactionRemove',
                            label: `${element.element.reverse ? 'Add' : 'Remove'}Roles`,
                            guild: { id: message.guild.id, name: message.guild.name },
                            target: { id: member.id, name: member.user.tag }
                        })
                    } catch (err) {
                        await self.logger.handleError({
                            module: 'InteractiveReactions',
                            action: 'RemoveRoles',
                            error: err,
                            guild_id: message.guildId
                        })

                        return false
                    }
                }
            }
        }
    }
}

export const autoReactionMessageTypes = {
    DEFAULT: 0,
    CHANNEL_PINNED_MESSAGE: 6,
    GUILD_MEMBER_JOIN: 7,
    USER_PREMIUM_GUILD_SUBSCRIPTION: 8,
    USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1: 9,
    USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2: 10,
    USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3: 11,
    CHANNEL_FOLLOW_ADD: 12,
    THREAD_CREATED: 18,
    REPLY: 19
}

export async function autoReact(self: Lacuna, server: ServerDocument, message: Message) {
    const ar: AutoReaction = server.modules.autoreactions
        .slice(0, server.server.premium.available ? 20 : 2)
        .find(i => i.channel_id == message.channel.id)

    if (ar) {
        if (ar.message_types?.length) {
            const includesMessageType = ar.message_types.map(i => autoReactionMessageTypes[i]).includes(message.type)

            if (!includesMessageType) return false
        }

        const content: string = message.content.toLowerCase()
        const splitted: string[] = split(content)

        if (ar.matches.length) {
            const match = ar.matches.map(i => i.toLowerCase()).some(i => splitted.includes(i))

            if (!match) return false
        }

        if (ar.exclude_matches.length) {
            const match = ar.exclude_matches.map(i => i.toLowerCase()).some(i => splitted.includes(i))

            if (match) return false
        }

        for (const emoji of ar.reactions) {
            try {
                await message.react(emoji.id || emoji.name)
            } catch (err) {
                await self.logger.handleError({
                    module: 'AutoReactions',
                    action: 'AddReaction',
                    error: err,
                    guild_id: message.guildId
                })
            }
        }

        self.emit('moduleExecution', {
            module: 'AutoReactions',
            category: 'AddReactions',
            guild: { id: message.guild.id, name: message.guild.name },
            target: { id: message.author.id, name: message.author.tag }
        })

        return true
    }

    return false
}

export default {
    generateId,
    parseId,
    reactionAdd,
    reactionRemove,
    autoReact
}
