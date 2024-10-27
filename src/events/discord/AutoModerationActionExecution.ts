import { AutoModerationActionExecution, Events } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

export default {
    name: Events.AutoModerationActionExecution,
    handler: async (self: Lacuna, autoModActionExecution: AutoModerationActionExecution) => {
        const { guild, ruleId, userId, action, channel } = autoModActionExecution,
            rule = await guild.autoModerationRules.fetch(ruleId)

        const ruleCacheKey = `DAM-${guild.id}-${ruleId}-${userId}`
        let ruleCache: number[] = self.cache.get(ruleCacheKey)
        if (!ruleCache) ruleCache = self.cache.set(ruleCacheKey, []).get(ruleCacheKey)

        ruleCache.push(action.type)
        if (!rule.actions.every(v => ruleCache.includes(v.type))) return false
        self.cache.delete(ruleCacheKey)

        const member = await guild.members.fetch({ user: userId })
        self.emit('autoModerationRuleTrigger', rule, member, channel)

        return true
    }
}
