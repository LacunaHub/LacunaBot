import { BaseGuildTextChannel, MessageEmbed, VoiceState, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, before: VoiceState, state: VoiceState): Promise<boolean> {
    if (server.moderation.logs.types.voice_disconnect.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_move.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(state.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

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
                    webhook = await log.createWebhook(`${self.user.username}`, {
                        avatar: self.user.displayAvatarURL(),
                        reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_move.title)
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

            const embed = new MessageEmbed()
                .setTitle(locale.logs.voice_move.title)
                .setDescription(self.translator.format(locale.logs.voice_move.template, `**${state.member.user.tag}**`))
                .addField(locale.logs.voice_move.old_channel, `<#${before.channelId}>`, true)
                .addField(locale.logs.voice_move.new_channel, `<#${state.channelId}>`, true)
                .setFooter({ text: state.member.id })
                .setTimestamp()
                .setColor('#FFA726')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            self.emit('moduleExecution', {
                module: 'Logs: Voice Move',
                guild: { id: state.guild.id, name: state.guild.name },
                target: { id: state.member.id, name: state.member.user.tag }
            })

            return true
        }
    }

    return false
}
