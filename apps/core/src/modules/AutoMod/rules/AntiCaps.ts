import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { removeDiscordPatterns, splitStringCase } from '@/internals/utility/Utils.js'
import { Message } from 'discord.js'
import banAction from '../actions/BanAction.js'
import deleteMessageAction from '../actions/DeleteMessageAction.js'
import kickAction from '../actions/KickAction.js'
import modifyRolesAction from '../actions/ModifyRolesAction.js'
import muteAction from '../actions/MuteAction.js'
import sendMessageAction from '../actions/SendMessageAction.js'
import warnUserAction from '../actions/WarnUserAction.js'

export default async function moderateCaps(self: Lacuna, server: ServerDocument, message: Message<true>) {
    const reason = 'AutoMod: Anti-Caps'
    const config = server.moderation.automoder.anti_caps

    if (!config.active) return false
    if (config.ignored.channels.includes(message.channel.id)) return false

    const target = message.member!,
        configPermissions = BigInt(config.ignored.permissions.reduce((x, y) => x | y, 0))

    if (target.permissions.any(configPermissions, false)) return false
    if (target.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    const splittedCase = splitStringCase(removeDiscordPatterns(message.content)),
        upperCasePercent = splittedCase.length ? Math.floor((splittedCase.upper.length * 100) / splittedCase.length) : 0

    if (upperCasePercent >= config.percentage_of_caps && message.content.length >= config.minimum_content_length) {
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
            await warnUserAction(self, server, message, {
                target,
                executor: message.guild.members.me!,
                reason
            })
        if (optSendMessage) await sendMessageAction(self, { config, message })
        if (optDeleteMessage) await deleteMessageAction(self, { message })

        self.emit('moduleExecution', {
            guildId: message.guildId,
            targetId: message.author.id,
            module: 'AutoMod',
            category: 'AntiCaps'
        })

        return true
    }
}
