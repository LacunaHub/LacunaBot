import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Events, GuildMember } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import { activePatronRoleId, formerPatronRoleId, supportServerId } from '../../internals/utility/Constants'
import { fetchGuild } from '../../internals/utility/Utils'
import Automation from '../../modules/Automation'
import Automoder from '../../modules/Automoder'
import Greeting from '../../modules/Greeting'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Logs from '../../modules/Logs'
import { checkReportsOnGuildMemberAdd } from '../../modules/Reports'

const handler = async (self: Lacuna, member: GuildMember) => {
    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    await fetchGuild(self.cache, member.guild)
    await Greeting.sendMessage(self, server, member)

    if (!member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) {
        await Greeting.addInitialRoles(self, server, member)
        await Greeting.restoreNicknameAndRoles(self, server, member)
    }

    await Automation.handleEvent('GUILD_MEMBER_ADD', self, server, member)
    await checkReportsOnGuildMemberAdd(self, server, member)
    await Automoder.nicknamesModeration(self, server, member)
    await Automoder.newbiesModeration(self, server, member)
    await GuildImageRotation.rotateBanner(self, server, member.guild, member)
    await Logs.GuildMemberAdd(self, server, member)

    if (member.guild.id === supportServerId) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.premium?.available) {
            await member.roles.add(activePatronRoleId)
        }

        if (user?.premium?.available === false && user?.premium?.last_charge_timestamp) {
            await member.roles.add(formerPatronRoleId)
        }
    }

    return true
}

export default {
    name: Events.GuildMemberAdd,
    handler
}
