// DAME - Discord AutoMod Extension

import { ServerDocument, ServerModerationDAMERuleActionType } from '@/database/schemas/Servers'
import { AutoModerationRule, ForumChannel, GuildMember, GuildTextBasedChannel, MediaChannel } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Moderation from '../Moderation'
import { createCaseLogEntry } from '../Moderation/CaseLog'
import Replacer from '../Replacer'

async function handleAutoModTrigger(
    self: Lacuna,
    server: ServerDocument,
    autoModeRule: AutoModerationRule,
    targetMember: GuildMember,
    channel: GuildTextChannel
) {
    const dameRule = server.moderation.dame_rules.find(v => v.id === autoModeRule.id)
    if (!dameRule || !dameRule.enabled) return false

    const guild = autoModeRule.guild
    const targetUser = targetMember.user
    let reason = dameRule.name

    for (const action of dameRule.actions) {
        if (action.type === ServerModerationDAMERuleActionType.BlockMessage) continue
        if (action.type === ServerModerationDAMERuleActionType.SendAlertMessage) continue
        if (action.type === ServerModerationDAMERuleActionType.BlockMemberInteraction) continue

        if (action.type === ServerModerationDAMERuleActionType.Timeout) {
            await createCaseLogEntry(autoModeRule.guild, {
                type: 'MuteAdd',
                target: targetUser,
                executor: 'Discord AutoMod',
                reason
            })

            await Moderation.muteUserRemoveAllRoles(self, server, targetMember)
        }

        if (action.type === ServerModerationDAMERuleActionType.Ban)
            await Moderation.banUser(self, server, guild, { target: targetMember, durationSeconds: action.metadata.duration_seconds, reason })

        if (action.type === ServerModerationDAMERuleActionType.Kick) await Moderation.kickUser(self, server, guild, { target: targetMember, reason })

        if (action.type === ServerModerationDAMERuleActionType.Warn) {
            await Moderation.warnUser(self, server, guild, {
                target: targetMember,
                executor: self.user,
                reason,
                channel
            })
        }

        if (action.type === ServerModerationDAMERuleActionType.ModifyRoles) {
            const addRoles = action.metadata.add_roles ?? [],
                removeRoles = action.metadata.remove_roles ?? []

            try {
                if (Array.isArray(addRoles) && addRoles.length) {
                    await targetMember.roles.add(addRoles)
                }

                if (Array.isArray(removeRoles) && removeRoles.length) {
                    await targetMember.roles.remove(removeRoles)
                }
            } catch (err) {
                self.logger.error({ module: 'DAME', action: 'ModifyRoles', err, guildId: guild.id })
            }
        }

        if (action.type === ServerModerationDAMERuleActionType.SendMessage) {
            try {
                const replacer = new Replacer(server.premium.available, { guild, member: targetMember }),
                    messagePayload = await replacer.replaceTemplateMessage(action.metadata.message)

                if (channel.isSendable()) await channel.send(messagePayload)
            } catch (err) {
                self.logger.error({ module: 'DAME', action: 'SendMessage', err, guildId: guild.id })
            }
        }
    }

    self.emit('moduleExecution', {
        guildId: guild.id,
        targetId: targetUser.id,
        module: 'DAME'
    })

    return true
}

export default {
    handleAutoModTrigger
}

export type GuildTextChannel = ForumChannel | MediaChannel | GuildTextBasedChannel
