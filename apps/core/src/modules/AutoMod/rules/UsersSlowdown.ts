import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { Message } from 'discord.js'
import banAction from '../actions/BanAction.js'
import deleteMessageAction from '../actions/DeleteMessageAction.js'
import kickAction from '../actions/KickAction.js'
import modifyRolesAction from '../actions/ModifyRolesAction.js'
import muteAction from '../actions/MuteAction.js'
import sendMessageAction from '../actions/SendMessageAction.js'
import warnUserAction from '../actions/WarnUserAction.js'

const slowedUsers = new Map()

export default async function slowdownUsers(self: Lacuna, server: ServerDocument, message: Message<true>) {
    const reason = 'AutoMod: Users slowdown'
    const config = server.moderation.automoder.users_slowdown

    if (!config.active) return false
    if (config.ignored.channels.includes(message.channel.id)) return false

    const target = message.member!,
        configPermissions = BigInt(config.ignored.permissions.reduce((x, y) => x | y, 0))

    if (target.permissions.any(configPermissions, false)) return false
    if (target.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    let slowed = slowedUsers.get(message.author.id)
    if (!slowed)
        slowed = slowedUsers
            .set(message.author.id, { messages: 0, messages_id: [], timeout: null })
            .get(message.author.id)

    slowed.messages++
    await slowed.messages_id.push(message.id)

    if (!slowed.timeout) {
        slowed.timeout = setTimeout(() => slowedUsers.delete(message.author.id), 5000)
    }

    if (slowed.messages > config.messages_limit) {
        const optBan = config.options.includes('ACTION_BAN'),
            optKick = config.options.includes('ACTION_KICK'),
            optModifyRoles = config.options.includes('ACTION_MODIFY_ROLES'),
            optMute = config.options.includes('ACTION_MUTE'),
            optWarn = config.options.includes('ACTION_WARN'),
            optSendMessage = config.options.includes('ACTION_SEND_MESSAGE'),
            optDeleteMessage = config.options.includes('ACTION_DELETE_MESSAGE')

        if (optBan && !optKick && !optMute)
            await banAction(self, server, { config, guild: message.guild, target, reason })
        if (optKick && !optBan && !optMute) await kickAction(self, { guild: message.guild, target, reason })
        if (optModifyRoles && !optBan && !optKick)
            modifyRolesAction(self, { config, guild: message.guild, target, reason })
        if (optMute && !optBan && !optKick)
            await muteAction(self, server, { config, guild: message.guild, target, reason })
        if (optWarn)
            await warnUserAction(self, server, message, { target, executor: message.guild.members.me!, reason })
        if (optSendMessage) await sendMessageAction(self, server, { config, message })
        if (optDeleteMessage) await deleteMessageAction(self, { message })

        clearTimeout(slowed.timeout)
        slowedUsers.delete(message.author.id)

        self.emit('moduleExecution', {
            guildId: message.guildId,
            targetId: message.author.id,
            module: 'AutoMod',
            category: 'UsersSlowdown'
        })

        return true
    }

    return false
}
