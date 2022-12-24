import { BaseGuildTextChannel, EmbedBuilder, Guild, Invite, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, invite: Invite): Promise<boolean> {
    if (server.moderation.logs.types.invite_create.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = (invite.guild as Guild).channels.cache.get(server.moderation.logs.types.invite_create.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor((invite.guild as Guild).members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: invite.guild.id },
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.invite_create_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: invite.guild.id },
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
                .setTitle(t('logs.invite_create_title'))
                .addFields([
                    { name: t('logs.invite_code'), value: `[${invite.code}](${invite.url})`, inline: true },
                    { name: t('common.channel'), value: `<#${invite.channel.id}>`, inline: true },
                    { name: t('logs.invite_inviter'), value: invite.inviter?.tag ?? '-', inline: true }
                ])
                .setTimestamp()
                .setColor('#2FDF84')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'InviteCreate',
                guild: { id: invite.guild.id, name: invite.guild.name },
                target: { id: invite.channel.name, name: invite.code }
            })

            return true
        }
    }

    return false
}
