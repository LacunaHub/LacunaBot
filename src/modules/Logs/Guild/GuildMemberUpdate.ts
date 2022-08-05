import { BaseGuildTextChannel, GuildMember, MessageEmbed, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: GuildMember, member: GuildMember): Promise<boolean> {
    if (server.moderation.logs.types.guild_member_update.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(member.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            const audit = member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG)
                ? await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_UPDATE' })
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
                    webhook = await log.createWebhook(`${self.user.username}`, {
                        avatar: self.user.displayAvatarURL(),
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.guild_member_update_title') })
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

            if (before.displayName != member.displayName) {
                const embed = new MessageEmbed()
                    .setTitle(t('logs.guild_member_update_title'))
                    .setDescription(
                        t('logs.update_template', {
                            user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`,
                            change: t('logs.guild_member_update_nick_change_template', { user: `**${member.user.tag}** (${member.id})` })
                        })
                    )
                    .addField(t('logs.before_change'), before.displayName, true)
                    .addField(t('logs.after_change'), member.displayName, true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })

                self.emit('moduleExecution', {
                    module: 'Logs: Guild Member Update',
                    guild: { id: member.guild.id, name: member.guild.name },
                    target: { id: member.id, name: member.user.tag }
                })
            }

            return true
        }
    }

    return false
}
