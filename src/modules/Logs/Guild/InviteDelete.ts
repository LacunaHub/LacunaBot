import { BaseGuildTextChannel, Guild, Invite, MessageEmbed, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function(self: Lacuna, server: ServerDocument, invite: Invite): Promise<boolean> {
    if (server.moderation.logs.types.invite_delete.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = (invite.guild as Guild).channels.cache.get(server.moderation.logs.types.invite_delete.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor((invite.guild as Guild).me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook : null

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne({ _id: invite.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.invite_delete.title) })
                } catch (err) { return false }

                await self.db.servers.updateOne({ _id: invite.guild.id }, {
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
                .setTitle(locale.logs.invite_delete.title)
                .addField(locale.logs.common.invite_code, invite.code, true)
                .addField(locale.logs.common.channel, `<#${invite.channel.id}>`, true)
                .addField(locale.logs.common.invite_inviter, invite.inviter?.tag ?? '-', true)
                .setTimestamp()
                .setColor('#EF5350')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', { module: 'Logs: Invite Delete', guild: { id: invite.guild.id, name: invite.guild.name }, target: { id: invite.channel.name, name: invite.code } })
        
            return true
        }
    }

    return false
}