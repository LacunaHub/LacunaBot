import { ServerDocument } from '@/database/schemas/Servers'
import { Guild, GuildMember } from 'discord.js'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

async function rotateBanner(self: Lacuna, server: ServerDocument, guild: Guild, member?: GuildMember) {
    if (!server.modules.guild_image_rotation.banner.active) return false

    const rotationThrottle = server.premium.available ? 1000 * 60 * 2 : 1000 * 60 * 60

    if (rotationThrottle > Date.now() - server.modules.guild_image_rotation.banner.last_updated_timestamp) return false

    try {
        const replacer = new Replacer(server.premium.available, { guild, member }),
            { files } = await replacer.replaceTemplateMessage({ content: '', image: server.modules.guild_image_rotation.banner.image })

        await guild.setBanner(files[0].attachment as Buffer, 'Banner Rotation')
        await self.db.servers.updateOne(
            { _id: guild.id },
            {
                $set: {
                    'modules.guild_image_rotation.banner.last_updated_timestamp': Date.now()
                }
            }
        )

        self.emit('moduleExecution', {
            guildId: guild.id,
            targetId: guild.id,
            module: 'GuildImageRotation',
            category: 'RotateBanner'
        })

        return true
    } catch (err) {
        await self.db.servers.updateOne(
            { _id: guild.id },
            {
                $set: {
                    'modules.guild_image_rotation.banner.last_updated_timestamp': Date.now() + rotationThrottle / 2
                }
            }
        )
        self.logger.error({ module: 'GuildImageRotation', action: 'RotateBanner', err, guildId: guild.id })
    }

    return false
}

export default {
    rotateBanner
}
