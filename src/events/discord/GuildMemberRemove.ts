import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Events, GuildMember } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Automation from '../../modules/Automation'
import Farewell from '../../modules/Farewell'
import GuildImageRotation from '../../modules/GuildImageRotation'
import Logs from '../../modules/Logs'

const handler = async (self: Lacuna, member: GuildMember) => {
    if (!member || !member.guild) return false

    const server: ServerDocument = await self.db.servers.fetch({ _id: member.guild.id })

    await self.fetchGuild(member.guild)
    await Farewell.sendMessage(self, server, member)
    await Farewell.saveNicknameAndRoles(self, server, member)
    await Automation.handleEvent('GUILD_MEMBER_REMOVE', self, server, member)

    if (server.modules.levels.reset_on_leave) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.activities?.levels?.some(i => i.guild_id == member.guild.id)) {
            await self.db.users.updateOne(
                { _id: member.id },
                {
                    $pull: {
                        'activities.levels': { guild_id: member.guild.id } as never
                    }
                }
            )
        }
    }

    if (server.modules.economy.reset_wallet_on_leave) {
        const user = await self.db.users.findOne({ _id: member.id })

        if (user?.activities?.wallets?.some(i => i.guild_id == member.guild.id)) {
            await self.db.users.updateOne(
                { _id: member.id },
                {
                    $pull: {
                        wallets: { guild_id: member.guild.id } as never
                    }
                }
            )
        }
    }

    await GuildImageRotation.rotateBanner(self, server, member.guild, member)
    await Logs.GuildMemberRemove(self, server, member)

    return true
}

export default {
    name: Events.GuildMemberRemove,
    handler
}
