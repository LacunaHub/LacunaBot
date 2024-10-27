import { APIAutoModerationRule, AutoModerationRule, Events, Routes } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

export default {
    name: Events.AutoModerationRuleCreate,
    handler: async (self: Lacuna, autoModRule: AutoModerationRule) => {
        const server = await self.db.servers.findOne({ _id: autoModRule.guild.id })
        if (!server || server.blocked) return false
        if (autoModRule.creatorId === self.user.id) return false

        const apiAutoModRule = (await self.rest.get(Routes.guildAutoModerationRule(server._id, autoModRule.id))) as APIAutoModerationRule

        await self.db.servers.updateOne(
            { _id: server._id },
            {
                $push: {
                    'moderation.dame_rules': {
                        id: apiAutoModRule.id,
                        name: apiAutoModRule.name,
                        event_type: apiAutoModRule.event_type,
                        trigger_type: apiAutoModRule.trigger_type,
                        trigger_metadata: apiAutoModRule.trigger_metadata,
                        actions: apiAutoModRule.actions,
                        enabled: apiAutoModRule.enabled,
                        exempt_roles: apiAutoModRule.exempt_roles,
                        exempt_channels: apiAutoModRule.exempt_channels
                    }
                }
            }
        )

        return true
    }
}
