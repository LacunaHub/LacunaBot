import { BaseGuildTextChannel, Guild, MessageEmbed, User, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, guild: Guild, user: User): Promise<boolean> {
    if (server.moderation.logs.types.guild_ban_add.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = guild.channels.cache.get(server.moderation.logs.types.guild_ban_add.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_ADD' }) : null
            const executor = audit?.entries?.first()?.executor
            const reason = audit?.entries?.first()?.reason

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: guild.id },
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
                    webhook = await log.createWebhook(`${self.user.username}`, {
                        avatar: self.user.displayAvatarURL(),
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.guild_ban_add_title') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: guild.id },
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

            const embed = new MessageEmbed()
                .setTitle(t('logs.guild_ban_add_title'))
                .setDescription(t('logs.guild_ban_add_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, target: `**${user.tag}** (${user.id})` }))
                .addField(t('case_log.reason'), reason ?? '-')
                .setTimestamp()
                .setColor('#EF5350')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', { module: 'Logs: Guild Ban Add', guild: { id: guild.id, name: guild.name }, target: { id: user.id, name: user.tag } })

            return true
        }
    }

    return false
}
