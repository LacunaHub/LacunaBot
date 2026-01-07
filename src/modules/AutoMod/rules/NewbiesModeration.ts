import { ServerDocument } from '@/database/schemas/Servers'
import { GuildMember } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import banAction from '../actions/BanAction'
import kickAction from '../actions/KickAction'
import modifyRolesAction from '../actions/ModifyRolesAction'
import muteAction from '../actions/MuteAction'

export default async function moderateNewbies(self: Lacuna, server: ServerDocument, member: GuildMember) {
    const reason = 'AutoMod: Newbies moderation'
    const config = server.moderation.automoder.newbies

    if (!config.active) return false

    const measures = {
        MINUTES: 60,
        HOURS: 3600,
        DAYS: 86400
    }

    const isNewbie =
        (Date.now() - member.user.createdTimestamp) / 1000 < config.minimum_account_age.value * measures[config.minimum_account_age.measure]

    if (isNewbie) {
        const optBan = config.options.includes('ACTION_BAN'),
            optKick = config.options.includes('ACTION_KICK'),
            optMute = config.options.includes('ACTION_MUTE'),
            optModifyRoles = config.options.includes('ACTION_MODIFY_ROLES')

        if (optBan && !optKick && !optMute) await banAction(self, server, { config, guild: member.guild, target: member, reason })
        if (optKick && !optBan && !optMute) await kickAction(self, { guild: member.guild, target: member, reason })
        if (optModifyRoles && !optBan && !optKick) modifyRolesAction(self, { config, guild: member.guild, target: member, reason })
        if (optMute && !optBan && !optKick) await muteAction(self, server, { config, guild: member.guild, target: member, reason })

        self.emit('moduleExecution', {
            guildId: member.guild.id,
            targetId: member.id,
            module: 'AutoMod',
            category: 'NewbiesModeration'
        })

        return true
    }
}
