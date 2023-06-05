import { Events, GuildMember } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { support_server_id } from '../../internals/utility/BillUtils'
import Automation from '../../modules/Automation'
import { newbiesModeration, nicknamesModeration } from '../../modules/Automoder'
import Greeting from '../../modules/Greeting'
import { GuildMemberAdd } from '../../modules/Logs'
import { checkReportsOnGuildMemberAdd } from '../../modules/Reports'

const handler = async (self: Lacuna, member: GuildMember) => {
    if (member.partial) {
        try {
            member = await member.fetch()
        } catch (err) {}
    }

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    if (!member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) await Greeting(self, server, member)

    await GuildMemberAdd(self, server, member)
    await nicknamesModeration(self, server, member)
    await newbiesModeration(self, server, member)
    await checkReportsOnGuildMemberAdd(self, server, member)
    await Automation.handleEvent('GUILD_MEMBER_ADD', self, server, member)

    if (member.guild.id === support_server_id) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.premium?.available) {
            await member.roles.add('968097093388468274')
        }

        if (user?.premium?.last_charge_timestamp) {
            await member.roles.add('746825813806284866')
        }
    }

    return true
}

export default {
    name: Events.GuildMemberAdd,
    handler
}
