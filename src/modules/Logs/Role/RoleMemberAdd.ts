import { AuditLogEvent, BaseGuildTextChannel, Collection, EmbedBuilder, GuildMember, Role, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember, roles: Collection<string, Role>): Promise<boolean> {
    if (server.moderation.logs.types.role_member_add.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = member.guild.channels.cache.get(server.moderation.logs.types.role_member_add.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(member.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = member.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate })
                : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: member.guild.id },
                        {
                            $pull: {
                                'moderation.logs.webhooks': {
                                    channel_id: log.id
                                }
                            }
                        }
                    )
                }

                try {
                    webhook = await log.createWebhook({
                        name: self.user.username,
                        avatar: self.user.displayAvatarURL(),
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.role_member_add_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: member.guild.id },
                    {
                        $push: {
                            'moderation.logs.webhooks': {
                                id: webhook.id,
                                token: webhook.token,
                                channel_id: webhook.channelId
                            }
                        }
                    }
                )
            }

            const embed = new EmbedBuilder()
                .setTitle(t('logs.role_member_add_title'))
                .setDescription(
                    t('logs.role_member_add_template', {
                        user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                        target: `**${member.user.tag}**`
                    })
                )
                .addFields([{ name: t('common.roles'), value: roles.map(role => `<@&${role.id}>`).join(', '), inline: true }])
                .setFooter({ text: member.id })
                .setTimestamp()
                .setColor('#2FDF84')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'RoleMemberAdd',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })

            return true
        }
    }

    return false
}
