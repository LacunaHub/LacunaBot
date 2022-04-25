import { Collection, GuildChannel, MessageReaction, User } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { reactionRemove } from '../../modules/Reactions'

const handler = async (self: Lacuna, reaction: MessageReaction, user: User) => {
    if (self.user.id == user.id) return false

    let partial = reaction.partial

    reaction = partial ? await reaction.fetch() : reaction

    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message

    if (message.channel.type == 'DM') return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: message.guild.id })

    await reactionRemove(self, server, reaction, user)

    const im = server.modules.interactive_messages.slice(0, server.server.premium.available ? 50 : 5).find(i => i.id == message.id)

    if (im) {
        const member = await message.guild.members.fetch(user.id)
        const imReaction = im.reactions.slice(0, 10).find(i => (i.emoji.id ? i.emoji.id == reaction.emoji.id : i.emoji.name == reaction.emoji.name))

        if (imReaction?.options?.includes('MODIFY_ROLES') && imReaction?.modify_roles) {
            const addRoles = message.guild.roles.cache.filter(i => i.editable && imReaction.modify_roles.add.includes(i.id)).first(8)
            const removeRoles = message.guild.roles.cache.filter(i => i.editable && imReaction.modify_roles.remove.includes(i.id)).first(8)

            if (addRoles.length) {
                const hasRoles = imReaction.modify_roles.reversible_add && member.roles.cache.hasAny(...addRoles.map(i => i.id))

                if (hasRoles) await member.roles.remove(addRoles).catch(() => {})
            }

            if (removeRoles.length) {
                const missingRoles = imReaction.modify_roles.reversible_remove && !member.roles.cache.hasAll(...removeRoles.map(i => i.id))

                if (missingRoles) await member.roles.add(removeRoles).catch(() => {})
            }
        }

        if (imReaction?.options?.includes('OVERWRITE_CHANNEL_PERMISSIONS') && imReaction?.overwrite_channel_permissions) {
            // prettier-ignore
            const channels = message.guild.channels.cache.filter(i => i.manageable && imReaction.overwrite_channel_permissions.channels.includes(i.id)) as Collection<string, GuildChannel>

            for (const channel of channels.first(8)) {
                const overwrites = channel.permissionOverwrites.cache.get(user.id)

                if (overwrites && imReaction.overwrite_channel_permissions.reversible) {
                    await overwrites.delete().catch(() => {})
                }
            }
        }
    }

    if (partial) {
        message.reactions.cache.delete(reaction.emoji.id || reaction.emoji.name)
        message.channel.messages.cache.delete(message.id)
    }

    return true
}

export default {
    name: 'messageReactionRemove',
    handler
}
