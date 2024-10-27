import { APIAutoModerationRule, AuditLogEvent, Events, Guild, GuildAuditLogsEntry, Role, Routes, User } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import Logs from '../../modules/Logs'
import { createCaseLogEntry } from '../../modules/Moderation/CaseLog'

export default {
    name: Events.GuildAuditLogEntryCreate,
    handler: async (self: Lacuna, auditLogEntry: GuildAuditLogsEntry, guild: Guild) => {
        const server = await self.db.servers.findOne({ _id: guild.id })
        if (!server || server.blocked) return false

        if (auditLogEntry.executorId) auditLogEntry.executor = await self.users.fetch(auditLogEntry.executorId)
        if (auditLogEntry.targetType === 'User') auditLogEntry.target = await self.users.fetch(auditLogEntry.targetId)

        if (auditLogEntry.action === AuditLogEvent.AutoModerationRuleDelete) {
            if (auditLogEntry.executorId !== self.user.id) {
                const dameRule = server.moderation.dame_rules.find(v => v.id === auditLogEntry.targetId)
                if (dameRule) {
                    await self.db.servers.updateOne(
                        { _id: guild.id },
                        {
                            $pull: {
                                'moderation.dame_rules': {
                                    id: auditLogEntry.targetId
                                }
                            }
                        }
                    )
                }
            }
        }

        if (auditLogEntry.action === AuditLogEvent.AutoModerationRuleUpdate) {
            if (auditLogEntry.executorId !== self.user.id) {
                const dameRule = server.moderation.dame_rules.find(v => v.id === auditLogEntry.targetId)
                if (dameRule) {
                    const apiAutoModRule = (await self.rest.get(
                        Routes.guildAutoModerationRule(server._id, auditLogEntry.targetId)
                    )) as APIAutoModerationRule

                    await self.db.servers.updateOne(
                        { _id: server._id, 'moderation.dame_rules.id': apiAutoModRule.id },
                        {
                            $set: {
                                'moderation.dame_rules.$.name': apiAutoModRule.name,
                                'moderation.dame_rules.$.event_type': apiAutoModRule.event_type,
                                'moderation.dame_rules.$.trigger_type': apiAutoModRule.trigger_type,
                                'moderation.dame_rules.$.trigger_metadata': apiAutoModRule.trigger_metadata,
                                'moderation.dame_rules.$.actions': [...apiAutoModRule.actions, ...dameRule.actions.filter(v => v.type > 100)],
                                'moderation.dame_rules.$.enabled': apiAutoModRule.enabled,
                                'moderation.dame_rules.$.exempt_roles': apiAutoModRule.exempt_roles,
                                'moderation.dame_rules.$.exempt_channels': apiAutoModRule.exempt_channels
                            }
                        }
                    )
                }
            }
        }

        if (auditLogEntry.action === AuditLogEvent.ChannelCreate) {
            await Logs.ChannelCreate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.ChannelDelete) {
            await Logs.ChannelDelete(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.ChannelUpdate) {
            await Logs.ChannelUpdate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.EmojiCreate) {
            await Logs.EmojiCreate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.EmojiDelete) {
            await Logs.EmojiDelete(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.EmojiUpdate) {
            await Logs.EmojiUpdate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.MemberBanAdd) {
            if (auditLogEntry.executorId !== self.user.id) {
                await createCaseLogEntry(guild, {
                    type: 'BanAdd',
                    target: auditLogEntry.target as User,
                    executor: auditLogEntry.executor,
                    reason: auditLogEntry.reason
                })
            }

            await self.db.serverBans.create({
                guild_id: guild.id,
                user_id: auditLogEntry.targetId,
                reason: auditLogEntry.reason || null
            })

            await Logs.GuildBanAdd(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.MemberBanRemove) {
            if (auditLogEntry.executorId !== self.user.id) {
                await createCaseLogEntry(guild, {
                    type: 'BanRemove',
                    target: auditLogEntry.target as User,
                    executor: auditLogEntry.executor,
                    reason: auditLogEntry.reason
                })
            }

            const tempBan = self.tempbans.get(`${guild.id}:${auditLogEntry.targetId}`)
            if (tempBan) await tempBan.delete(false, auditLogEntry.reason)

            await self.db.serverBans.updateMany({ guild_id: guild.id, user_id: auditLogEntry.targetId }, { $set: { removed_at: Date.now() } })
            await Logs.GuildBanRemove(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.MemberKick) {
            if (auditLogEntry.executorId !== self.user.id) {
                await createCaseLogEntry(guild, {
                    type: 'Kick',
                    target: auditLogEntry.target as User,
                    executor: auditLogEntry.executor,
                    reason: auditLogEntry.reason
                })
            }
        }

        if (auditLogEntry.action === AuditLogEvent.MemberUpdate) {
            const communicationDisabledUntil = auditLogEntry.changes.find(v => v.key === 'communication_disabled_until')

            if (communicationDisabledUntil) {
                if (auditLogEntry.executorId !== self.user.id) {
                    await createCaseLogEntry(guild, {
                        type: communicationDisabledUntil.new ? 'MuteAdd' : 'MuteRemove',
                        target: auditLogEntry.target as User,
                        executor: auditLogEntry.executor,
                        reason: auditLogEntry.reason
                    })
                }
            }

            await Logs.GuildMemberUpdate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.MemberRoleUpdate) {
            const $add = auditLogEntry.changes.find(v => v.key === '$add'),
                $remove = auditLogEntry.changes.find(v => v.key === '$remove')
            const addedRoles: Role[] = [],
                removedRoles: Role[] = []

            if ($add) {
                addedRoles.push(...$add.new.map(v => guild.roles.cache.get(v.id)))
                await Logs.GuildMemberRoleAdd(self, server, { guild, auditLogEntry: auditLogEntry as any })
            }

            if ($remove) {
                removedRoles.push(...$remove.new.map(v => guild.roles.cache.get(v.id)))
                await Logs.GuildMemberRoleRemove(self, server, { guild, auditLogEntry: auditLogEntry as any })
            }

            const targetMember = await guild.members.fetch({ user: auditLogEntry.targetId })

            if (addedRoles.length) self.emit('guildMemberRoleAdd', targetMember, addedRoles)
            if (removedRoles.length) self.emit('guildMemberRoleRemove', targetMember, removedRoles)
        }

        if (auditLogEntry.action === AuditLogEvent.GuildUpdate) {
            await Logs.GuildUpdate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.RoleCreate) {
            await Logs.RoleCreate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.RoleDelete) {
            await Logs.RoleDelete(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.RoleUpdate) {
            await Logs.RoleUpdate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.StickerCreate) {
            await Logs.StickerCreate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.StickerDelete) {
            await Logs.StickerDelete(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.StickerUpdate) {
            await Logs.StickerUpdate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.ThreadCreate) {
            await Logs.ThreadCreate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.ThreadDelete) {
            await Logs.ThreadDelete(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }

        if (auditLogEntry.action === AuditLogEvent.ThreadUpdate) {
            await Logs.ThreadUpdate(self, server, { guild, auditLogEntry: auditLogEntry as any })
        }
    }
}
