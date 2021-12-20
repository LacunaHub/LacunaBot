import { BaseGuildTextChannel, Collection, GuildMember, MessageEmbed, Role, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function(self: Lacuna, server: ServerDocument, member: GuildMember, roles: Collection<string, Role>): Promise<boolean> {
    if (server.moderation.logs.types.role_member_remove.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = member.guild.channels.cache.get(server.moderation.logs.types.role_member_remove.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(member.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook : null

            const audit = member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_ROLE_UPDATE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne({ _id: member.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.role_member_remove.title) })
                } catch (err) { return false }

                await self.db.servers.updateOne({ _id: member.guild.id }, {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: webhook.id,
                            token: webhook.token,
                            channel_id: webhook.channelId
                        }
                    }
                })
            }
        
            const embed = new MessageEmbed()
                .setTitle(locale.logs.role_member_remove.title)
                .setDescription(self.translator.format(locale.logs.role_member_remove.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, `**${member.user.tag}**`))
                .addField(locale.logs.common.roles, roles.map(role => `<@&${role.id}>`).join(', '), true)
                .setFooter(member.id)
                .setTimestamp()
                .setColor('#EF5350')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', { module: 'Logs: Role Member Remove', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        
            return true
        }
    }

    return false
}