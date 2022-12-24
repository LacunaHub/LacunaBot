import { BaseGuildTextChannel, Collection, Message, MessageReaction, MessageType, User } from 'discord.js'
import { AutoReaction, ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import { snakeToPascalCase } from '../internals/utility/Utils'

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
                        self.logger.error('An error occurred', err)

                        if (message.deletable) await reaction.users.remove(user.id)

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
                            self.logger.error('An error occurred', err)

                            if (message.deletable) await reaction.users.remove(user.id)

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
                            if (message.deletable) await reaction.users.remove(user.id)

                            return false
                        }

                        try {
                            await member.roles.add(roles, t('audit_reasons.irs'))
                        } catch (err) {
                            self.logger.error('An error occurred', err)

                            if (message.deletable) await reaction.users.remove(user.id)

                            return false
                        }
                    } else {
                        try {
                            await member.roles.add(roles, t('audit_reasons.irs'))
                        } catch (err) {
                            self.logger.error('An error occurred', err)

                            if (message.deletable) await reaction.users.remove(user.id)

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
                        self.logger.error('An error occurred', err)

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
                            module: `Reactions: ${element.element.reverse ? 'Add' : 'Remove'} Roles`,
                            category: 'ReactionRemove',
                            label: `${element.element.reverse ? 'Add' : 'Remove'}Roles`,
                            guild: { id: message.guild.id, name: message.guild.name },
                            target: { id: member.id, name: member.user.tag }
                        })
                    } catch (err) {
                        self.logger.error('An error occurred', err)

                        return false
                    }
                }
            }
        }
    }
}

export async function autoReact(self: Lacuna, server: ServerDocument, message: Message) {
    const auto_reaction: AutoReaction = server.modules.autoreactions
        .slice(0, server.server.premium.available ? 20 : 2)
        .find(ar => ar.channel_id == message.channel.id)

    if (auto_reaction) {
        if (
            auto_reaction.message_types &&
            auto_reaction.message_types.length &&
            !auto_reaction.message_types.map(i => MessageType[snakeToPascalCase(i)]).includes(message.type)
        )
            return false

        const content: string = message.content.toLowerCase()
        const split: string[] = content.split(/\s{1,}/)

        if (
            (auto_reaction.matches.length && !auto_reaction.matches.some(m => split.includes(m.toLowerCase()))) ||
            (auto_reaction.exclude_matches.length && auto_reaction.exclude_matches.some(m => split.includes(m.toLowerCase())))
        )
            return false

        for (const emoji of auto_reaction.reactions) {
            await message.react(emoji.id || emoji.name)
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
