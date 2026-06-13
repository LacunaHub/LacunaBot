import { ServerDocument } from '@/database/schemas/Servers'
import { BaseGuildTextChannel, Collection, MessageReaction, User } from 'discord.js'
import Lacuna from '../internals/Lacuna'

export async function handleReactionAdd(self: Lacuna, server: ServerDocument, reaction: MessageReaction, user: User): Promise<boolean> {
    if (server.modules.reactions.length) {
        const message = reaction.message
        const interactiveReaction = server.modules.reactions
            .slice(0, server.premium.available ? 200 : 50)
            .find(v => v.message.id === message.id && (v.emoji.id ? v.emoji.id === reaction.emoji.id : v.emoji.name === reaction.emoji.name))

        if (!interactiveReaction) return false

        const member = await message.guild.members.fetch(user.id)

        if (interactiveReaction.type === 'CHANNEL') {
            const channels = message.guild.channels.cache.filter(v => interactiveReaction.references.includes(v.id)) as Collection<
                string,
                BaseGuildTextChannel
            >
            if (!channels.size) return false

            for (const [, channel] of channels) {
                try {
                    await channel.permissionOverwrites.create(
                        user.id,
                        { ViewChannel: interactiveReaction.element.reverse ? true : false },
                        { reason: 'Interactive Reactions' }
                    )
                } catch (err) {
                    self.logger.error({
                        module: 'InteractiveReactions',
                        action: 'CreatePermissionOverwrites',
                        err,
                        guildId: message.guildId
                    })

                    break
                }
            }

            self.emit('moduleExecution', {
                guildId: message.guildId,
                targetId: member.id,
                module: 'InteractiveReactions',
                label: 'ViewChannel'
            })
        }

        if (interactiveReaction.type === 'ROLE') {
            let rolesToAdd = interactiveReaction.references,
                rolesToRemove = []

            const isSingleIR = interactiveReaction.element.single || interactiveReaction.element.global_single,
                isReverseIR = interactiveReaction.element.reverse

            if (isReverseIR) {
                rolesToAdd = []
                rolesToRemove = interactiveReaction.references
            }

            if (isSingleIR) {
                const otherSingleIRs = server.modules.reactions
                    .filter(v => v.id !== interactiveReaction.id && (v.element.global_single || (v.element.single && v.message.id === message.id)))
                    .flatMap(v => v.references)
                    .filter(v => member.roles.cache.has(v))

                if (otherSingleIRs.length) {
                    if (isReverseIR) rolesToRemove = []
                    else rolesToAdd = []
                }
            }

            rolesToAdd = [...new Set(rolesToAdd)]
            rolesToRemove = [...new Set(rolesToRemove)]

            try {
                if (rolesToAdd.length) await member.roles.add(rolesToAdd, 'Interactive Reactions')
                if (rolesToRemove.length) await member.roles.remove(rolesToRemove, 'Interactive Reactions')
            } catch (err) {
                self.logger.error({
                    module: 'InteractiveReactions',
                    action: 'Add',
                    err,
                    guildId: message.guildId
                })
            }

            self.emit('moduleExecution', {
                guildId: message.guildId,
                targetId: member.id,
                module: 'InteractiveReactions',
                category: 'Add'
            })
        }
    }

    return false
}

export async function handleReactionRemove(self: Lacuna, server: ServerDocument, reaction: MessageReaction, user: User) {
    if (server.modules.reactions.length) {
        const t = self.i18n.t.bind(null, server.locale)

        const message = reaction.message
        const interactiveReaction = server.modules.reactions
            .slice(0, server.premium.available ? 200 : 50)
            .find(v => v.message.id === message.id && (v.emoji.id ? v.emoji.id === reaction.emoji.id : v.emoji.name === reaction.emoji.name))

        if (!interactiveReaction) return false

        const member = await message.guild.members.fetch(user.id)

        if (interactiveReaction.type === 'CHANNEL') {
            const channels = message.guild.channels.cache.filter(v => interactiveReaction.references.includes(v.id)) as Collection<
                string,
                BaseGuildTextChannel
            >
            if (!channels.size) return false

            for (const [, channel] of channels) {
                try {
                    const overwrites = channel.permissionOverwrites.cache.find(v => v.id === user.id)

                    if (overwrites) {
                        await overwrites.delete('Interactive Reactions')
                    }
                } catch (err) {
                    self.logger.error({
                        module: 'InteractiveReactions',
                        action: 'DeletePermissionOverwrites',
                        err,
                        guildId: message.guildId
                    })

                    break
                }
            }

            self.emit('moduleExecution', {
                guildId: message.guildId,
                targetId: member.id,
                module: 'InteractiveReactions',
                label: 'DeleteChannelOverwrites'
            })
        }

        if (interactiveReaction.type === 'ROLE') {
            let rolesToAdd = [],
                rolesToRemove = interactiveReaction.references

            const isSingleIR = interactiveReaction.element.single || interactiveReaction.element.global_single,
                isReverseIR = interactiveReaction.element.reverse

            if (isReverseIR) {
                rolesToAdd = interactiveReaction.references
                rolesToRemove = []
            }

            if (isSingleIR) {
                const otherSingleIRs = server.modules.reactions
                    .filter(v => v.id !== interactiveReaction.id && (v.element.global_single || (v.element.single && v.message.id === message.id)))
                    .flatMap(v => v.references)
                    .filter(v => member.roles.cache.has(v))

                if (otherSingleIRs.length) {
                    if (isReverseIR) rolesToAdd = []
                    else rolesToRemove = []
                }
            }

            rolesToAdd = [...new Set(rolesToAdd)]
            rolesToRemove = [...new Set(rolesToRemove)]

            try {
                if (rolesToAdd.length) await member.roles.add(rolesToAdd, 'Interactive Reactions')
                if (rolesToRemove.length) await member.roles.remove(rolesToRemove, 'Interactive Reactions')
            } catch (err) {
                self.logger.error({
                    module: 'InteractiveReactions',
                    action: 'Remove',
                    err,
                    guildId: message.guildId
                })
            }

            self.emit('moduleExecution', {
                guildId: message.guildId,
                targetId: member.id,
                module: `InteractiveReactions`,
                category: 'Remove'
            })
        }
    }
}

export default {
    handleReactionAdd,
    handleReactionRemove
}
