import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { Collection, Invite, Message } from 'discord.js'
import banAction from '../actions/BanAction.js'
import deleteMessageAction from '../actions/DeleteMessageAction.js'
import kickAction from '../actions/KickAction.js'
import modifyRolesAction from '../actions/ModifyRolesAction.js'
import muteAction from '../actions/MuteAction.js'
import sendMessageAction from '../actions/SendMessageAction.js'
import warnUserAction from '../actions/WarnUserAction.js'

export default async function moderateLinks(self: Lacuna, server: ServerDocument, message: Message<true>) {
    const config = server.moderation.automoder.links_filter

    if (!config.active) return false
    if (config.ignored.channels.includes(message.channel.id)) return false

    const target = message.member!,
        configPermissions = BigInt(config.ignored.permissions.reduce((x, y) => x | y, 0))

    if (target.permissions.any(configPermissions, false)) return false
    if (target.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    const content = message.content.toLowerCase(),
        messageSplit = content.split(/\s{1,}/),
        messageLinks = message.content.match(/(https?:\/\/[^\s]+)/gi),
        discordInviteRegexp = /discord\.(gg|com\/invite)\/(\w+)/g

    if (messageLinks && messageLinks.length) {
        const deleteReferralInvites =
            config.options.includes('DELETE_REFERRAL_INVITES') && messageLinks.some(v => discordInviteRegexp.test(v))

        if (
            config.options.includes('DELETE_ALL_LINKS') &&
            !deleteReferralInvites &&
            !config.allowed_registry.some(reg => messageLinks.some(link => link.includes(reg)))
        ) {
            try {
                await message.delete()
            } catch (err) {
                self.logger.error({ module: 'AutoMod', action: 'LinksFilterDeleteLink', err, guildId: message.guildId })
            }

            await doActions(self, server, message)

            return true
        }
    }

    if (config.options.includes('DELETE_REFERRAL_INVITES')) {
        let guildInvites: Collection<string, Invite>
        let messageInvites = message.content.match(discordInviteRegexp),
            isReferral = false

        try {
            guildInvites = await message.guild.invites.fetch()
            messageInvites = message.content.match(discordInviteRegexp)
            isReferral =
                messageInvites?.some?.(v => {
                    const code = v.split('/').at(-1)
                    return guildInvites.some(vv => vv.code !== code)
                }) ?? false
        } catch (err) {
            self.logger.error({ module: 'AutoMod', action: 'LinksFilterFetchInvites', err, guildId: message.guildId })
        }

        if (isReferral) {
            try {
                await message.delete()
            } catch (err) {
                self.logger.error({
                    module: 'AutoMod',
                    action: 'LinksFilterDeleteInvite',
                    err,
                    guildId: message.guildId
                })
            }

            await doActions(self, server, message)

            return true
        }
    }

    if (config.blocked_registry.some(reg => messageSplit.some(s => s.includes(reg)))) {
        await doActions(self, server, message)

        return true
    }

    return false
}

async function doActions(self: Lacuna, server: ServerDocument, message: Message<true>) {
    const reason = 'AutoMod: Links filter'
    const config = server.moderation.automoder.links_filter

    const optBan = config.options.includes('ACTION_BAN'),
        optKick = config.options.includes('ACTION_KICK'),
        optMute = config.options.includes('ACTION_MUTE'),
        optWarn = config.options.includes('ACTION_WARN'),
        optModifyRoles = config.options.includes('ACTION_MODIFY_ROLES'),
        optSendMessage = config.options.includes('ACTION_SEND_MESSAGE'),
        optDeleteMessage = config.options.includes('ACTION_DELETE_MESSAGE')

    if (optBan && !optKick && !optMute)
        await banAction(self, server, { config, guild: message.guild, target: message.member!, reason })
    if (optKick && !optBan && !optMute)
        await kickAction(self, { guild: message.guild, target: message.member!, reason })
    if (optModifyRoles && !optBan && !optKick)
        modifyRolesAction(self, { config, guild: message.guild, target: message.member!, reason })
    if (optMute && !optBan && !optKick)
        await muteAction(self, server, { config, guild: message.guild, target: message.member!, reason })
    if (optWarn)
        await warnUserAction(self, server, message, {
            target: message.member!,
            executor: message.guild.members.me!,
            reason
        })
    if (optSendMessage) await sendMessageAction(self, server, { config, message })
    if (optDeleteMessage) await deleteMessageAction(self, { message })

    self.emit('moduleExecution', {
        guildId: message.guildId,
        targetId: message.author.id,
        module: 'AutoMod',
        category: 'LinksFilter'
    })
}
