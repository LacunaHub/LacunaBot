import Lacuna from '@/internals/Lacuna.js'
import DAME, { type GuildTextChannel } from '@/modules/DAME/index.js'
import { AutoModerationRule, GuildMember } from 'discord.js'

export default {
    name: 'autoModerationRuleTrigger',
    handler: async (self: Lacuna, autoModRule: AutoModerationRule, member: GuildMember, channel: GuildTextChannel) => {
        const server = await self.db.servers.findOne({ _id: autoModRule.guild.id })
        if (!server || server.blocked) return false

        await DAME.handleAutoModTrigger(self, server, autoModRule, member, channel)

        return true
    }
}
