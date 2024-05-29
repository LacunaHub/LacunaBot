import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Message } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import banAction from '../actions/BanAction'
import deleteMessageAction from '../actions/DeleteMessageAction'
import kickAction from '../actions/KickAction'
import modifyRolesAction from '../actions/ModifyRolesAction'
import muteAction from '../actions/MuteAction'
import sendMessageAction from '../actions/SendMessageAction'
import warnUserAction from '../actions/WarnUserAction'

export default async function moderateWords(self: Lacuna, server: ServerDocument, message: Message) {
    const reason = 'AutoMod: Swear filter'
    const config = server.moderation.automoder.swear_filter

    if (!config.active) return false
    if (config.ignored.channels.includes(message.channel.id)) return false

    const target = message.member,
        configPermissions = BigInt(config.ignored.permissions.reduce((x, y) => x | y, 0))

    if (target.permissions.any(configPermissions, false)) return false
    if (target.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    const content: string = message.content.toLowerCase()
    const split: string[] = content.split(/\s{1,}/)

    if (config.registry.some(reg => split.includes(reg.toLowerCase()))) {
        const optBan = config.options.includes('ACTION_BAN'),
            optKick = config.options.includes('ACTION_KICK'),
            optModifyRoles = config.options.includes('ACTION_MODIFY_ROLES'),
            optMute = config.options.includes('ACTION_MUTE'),
            optWarn = config.options.includes('ACTION_WARN'),
            optSendMessage = config.options.includes('ACTION_SEND_MESSAGE'),
            optDeleteMessage = config.options.includes('ACTION_DELETE_MESSAGE')

        if (optBan && !optKick && !optMute) await banAction(self, server, { config, guild: message.guild, target: message.member, reason })
        if (optKick && !optBan && !optMute) await kickAction(self, { guild: message.guild, target: message.member, reason })
        if (optModifyRoles && !optBan && !optKick) modifyRolesAction(self, { config, guild: message.guild, target: message.member, reason })
        if (optMute && !optBan && !optKick) await muteAction(self, server, { config, guild: message.guild, target: message.member, reason })
        if (optWarn) await warnUserAction(self, server, message, { target: message.member, executor: message.guild.members.me, reason })
        if (optSendMessage) await sendMessageAction(self, server, { config, message })
        if (optDeleteMessage) await deleteMessageAction(self, { message })

        self.emit('moduleExecution', {
            module: 'AutoMod',
            category: 'SwearFilter',
            guild: { id: message.guild.id, name: message.guild.name },
            target: { id: message.author.id, name: message.author.tag }
        })

        return true
    }
}
