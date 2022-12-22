import { BaseGuildTextChannel, EmbedBuilder, VoiceState, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_server_undeaf.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_undeaf.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(state.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? ((await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook) : null

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne(
                        { _id: state.guild.id },
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
                        reason: t('audit_reasons.logs_webhook_create', { event: t('logs.voice_server_undeaf') })
                    })
                } catch (err) {
                    return false
                }

                await self.db.servers.updateOne(
                    { _id: state.guild.id },
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
                .setTitle(t('logs.voice_server_undeaf'))
                .addFields([
                    { name: t('common.command_option_types.USER'), value: `${state.member.user.tag}`, inline: true },
                    { name: t('common.channel'), value: `<#${state.channelId}>`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                ])
                .setFooter({ text: state.member.id })
                .setTimestamp()
                .setColor('#FFA726')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', {
                module: 'Logs: Voice Server Undeaf',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }
    }

    return false
}
