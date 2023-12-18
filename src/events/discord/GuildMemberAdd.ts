import { Events, GuildMember } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { active_patron_role_id, former_patron_role_id, support_server_id } from '../../internals/utility/billing'
import Automation from '../../modules/Automation'
import Automoder from '../../modules/Automoder'
import Greeting from '../../modules/Greeting'
import Logs from '../../modules/Logs'
import { checkReportsOnGuildMemberAdd } from '../../modules/Reports'

const handler = async (self: Lacuna, member: GuildMember) => {
    if (member.partial) {
        try {
            member = await member.fetch()
        } catch (err) {}
    }

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    await Greeting.sendMessage(self, server, member)

    if (!member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) {
        await Greeting.addInitialRoles(self, server, member)
        await Greeting.restoreNicknameAndRoles(self, server, member)
    }

    await Automation.handleEvent('GUILD_MEMBER_ADD', self, server, member)
    await checkReportsOnGuildMemberAdd(self, server, member)
    await Automoder.nicknamesModeration(self, server, member)
    await Automoder.newbiesModeration(self, server, member)
    await Logs.GuildMemberAdd(self, server, member)

    if (member.guild.id === support_server_id) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.premium?.available) {
            await member.roles.add(active_patron_role_id)
        }

        if (user?.premium?.available === false && user?.premium?.last_charge_timestamp) {
            await member.roles.add(former_patron_role_id)
        }
    }

    return true
}

export default {
    name: Events.GuildMemberAdd,
    handler
}
