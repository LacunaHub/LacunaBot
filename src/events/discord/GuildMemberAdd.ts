import { GuildMember } from 'discord.js'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'
import { newbiesModeration, nicknamesModeration } from '../../modules/Automoder'
import Greeting from '../../modules/Greeting'
import { GuildMemberAdd } from '../../modules/Logs'

const handler = async (self: Lacuna, member: GuildMember) => {
    if (member.partial) {
        member = await member.fetch()
    }

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    if (!member.guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) await Greeting(self, server, member)

    await GuildMemberAdd(self, server, member)
    await nicknamesModeration(self, server, member)
    await newbiesModeration(self, server, member)

    return true
}

export default {
    name: 'guildMemberAdd',
    handler
}
