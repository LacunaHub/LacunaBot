import { BaseGuildTextChannel, MessageEmbed, Role, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function(self: Lacuna, server: ServerDocument, role: Role): Promise<boolean> {
    if (server.moderation.logs.types.role_delete.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = role.guild.channels.cache.get(server.moderation.logs.types.role_delete.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(role.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook : null

            const audit = role.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_DELETE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne({ _id: role.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.role_delete.title) })
                } catch (err) { return false }

                await self.db.servers.updateOne({ _id: role.guild.id }, {
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
                .setTitle(locale.logs.role_delete.title)
                .setDescription(self.translator.format(locale.logs.role_delete.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, `**${role.name}**`))
                .addField(locale.logs.role_create.color, `\`${role.hexColor}\``, true)
                .addField(locale.logs.common.position, role.rawPosition.toString(), true)
                .setFooter(role.id)
                .setTimestamp()
                .setColor('#EF5350')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', { module: 'Logs: Role Delete', guild: { id: role.guild.id, name: role.guild.name }, target: { id: role.name, name: role.id } })
        
            return true
        }
    }

    return false
}