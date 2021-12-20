import { MessageEmbed, BaseGuildTextChannel, GuildChannel, TextChannel, Webhook } from 'discord.js'
import { LogsWebhook, ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import numbro from 'numbro'

export default async function(self: Lacuna, server: ServerDocument, before: GuildChannel, channel: GuildChannel): Promise<boolean> {
    if (server.moderation.logs.types.channel_update.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_update.channel_id) as BaseGuildTextChannel

        const is_ok = log && log.permissionsFor(channel.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook: LogsWebhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) as Webhook : null

            const audit = channel.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_UPDATE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.updateOne({ _id: channel.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.channel_update.title) })
                } catch (err) { return false }

                await self.db.servers.updateOne({ _id: channel.guild.id }, {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: webhook.id,
                            token: webhook.token,
                            channel_id: webhook.channelId
                        }
                    }
                })
            }

            if (before.name != channel.name) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(self.translator.format(locale.logs.channel_update.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, self.translator.format(locale.logs.channel_update.name_update, `<#${channel.id}>`)))
                    .addField(locale.logs.common.before_changes, before.name, true)
                    .addField(locale.logs.common.after_changes, channel.name, true)
                    .setFooter(channel.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.isText() && channel.isText() && before.topic != channel.topic) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(self.translator.format(locale.logs.channel_update.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, self.translator.format(locale.logs.channel_update.topic_update, `<#${channel.id}>`)))
                    .addField(locale.logs.common.before_changes, before.topic ?? '-', true)
                    .addField(locale.logs.common.after_changes, channel.topic ?? '-', true)
                    .setFooter(channel.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if ((before as TextChannel).rateLimitPerUser != (channel as TextChannel).rateLimitPerUser) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(self.translator.format(locale.logs.channel_update.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, self.translator.format(locale.logs.channel_update.rate_limit_update, `<#${channel.id}>`)))
                    .addField(locale.logs.common.before_changes, (before as TextChannel).rateLimitPerUser ? numbro((before as TextChannel).rateLimitPerUser).format({ output: 'time' }) : '-', true)
                    .addField(locale.logs.common.after_changes, (channel as TextChannel).rateLimitPerUser ? numbro((channel as TextChannel).rateLimitPerUser).format({ output: 'time' }) : '-', true)
                    .setFooter(channel.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.parentId != channel.parentId) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(self.translator.format(locale.logs.channel_update.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, self.translator.format(locale.logs.channel_update.parent_update, `<#${channel.id}>`)))
                    .addField(locale.logs.common.before_changes, before?.parent?.name ?? '-', true)
                    .addField(locale.logs.common.after_changes, channel?.parent?.name ?? '-', true)
                    .setFooter(channel.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.isVoice() && channel.isVoice() && before.bitrate != channel.bitrate) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(self.translator.format(locale.logs.channel_update.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, self.translator.format(locale.logs.channel_update.bitrate_update, `<#${channel.id}>`)))
                    .addField(locale.logs.common.before_changes, `${before.bitrate / 1000}kbps`, true)
                    .addField(locale.logs.common.after_changes, `${channel.bitrate / 1000}kbps`, true)
                    .setFooter(channel.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.isVoice() && channel.isVoice() && before.userLimit != channel.userLimit) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(self.translator.format(locale.logs.channel_update.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, self.translator.format(locale.logs.channel_update.user_limit_update, `<#${channel.id}>`)))
                    .addField(locale.logs.common.before_changes, before.userLimit.toString(), true)
                    .addField(locale.logs.common.after_changes, channel.userLimit.toString(), true)
                    .setFooter(channel.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            self.emit('moduleExecution', { module: 'Logs: Channel Update', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
        
            return true
        }
    }

    return false
}