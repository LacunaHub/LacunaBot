import { AutoModerationRule, GuildMember } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import DAME, { GuildTextChannel } from '../../modules/DAME'

export default {
    name: 'autoModerationRuleTrigger',
    handler: async (self: Lacuna, autoModRule: AutoModerationRule, member: GuildMember, channel: GuildTextChannel) => {
        const server = await self.db.servers.findOne({ _id: autoModRule.guild.id })
        if (!server || server.blocked) return false

        await DAME.handleAutoModTrigger(self, server, autoModRule, member, channel)

        return true
    }
}
